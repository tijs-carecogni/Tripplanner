"""Tests for LLM-based intent routing and preference extraction.

These tests call the real LLM (requires LLM_ENDPOINT + LLM_API_KEY).
Run with:  pytest backend/tests/test_graph_llm.py -v -s
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Make backend importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

# Load .env before importing anything that checks is_configured()
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

from backend.py.graph import _detect_user_intent, _extract_preference_signals
from backend.py.models import GraphNode, HardPoint, TripContext, TripState, UserMemory
from backend.py.services.llm import is_configured

pytestmark = pytest.mark.skipif(not is_configured(), reason="LLM not configured")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _empty_state(**overrides) -> TripState:
    return TripState(**overrides)


def _state_with_anchors() -> TripState:
    """A trip with some anchors already set — triggers correction detection."""
    return TripState(
        trip_context=TripContext(primary_destination="Italy", start_date="2026-06-01", end_date="2026-06-15"),
        hard_points=[
            HardPoint(id="hp-aaa", title="Flight to Rome", type="flight",
                      start="2026-06-01T10:00:00", location="Rome, Italy"),
            HardPoint(id="hp-bbb", title="Hotel in Florence", type="hotel",
                      start="2026-06-05T14:00:00", end="2026-06-08T11:00:00", location="Florence, Italy"),
            HardPoint(id="hp-ccc", title="Train to Venice", type="train",
                      start="2026-06-08T12:00:00", location="Venice, Italy"),
        ],
    )


def _empty_memory() -> UserMemory:
    return UserMemory(user_id="test")


# ===================================================================
# Intent routing
# ===================================================================

class TestIntentRouting:
    """Verify the LLM router picks the right graph node."""

    # -- scaffold ----------------------------------------------------------

    async def test_initial_trip_info(self):
        """Big dump of trip logistics → scaffold."""
        text = (
            "We're going to Portugal from June 5 to June 20. "
            "Flying into Lisbon, renting a car, driving to the Algarve on the 10th."
        )
        node = await _detect_user_intent(text, _empty_state())
        assert node == GraphNode.scaffold

    async def test_adding_a_booking(self):
        """User adds a new flight → scaffold."""
        text = "Oh and we also booked a hotel in Porto for June 12-14"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.scaffold

    async def test_correcting_an_anchor(self):
        """User corrects an existing anchor → scaffold."""
        text = "Sorry, actually we fly from Milan not Rome"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.scaffold

    async def test_changing_dates(self):
        """User changes dates on existing booking → scaffold."""
        text = "The Florence hotel is actually the 6th to the 9th, not the 5th to 8th"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.scaffold

    # -- fill_gaps ---------------------------------------------------------

    async def test_skip_to_planning(self):
        """'Just plan it' → fill_gaps."""
        text = "Just go ahead and plan something"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.fill_gaps

    async def test_fill_open_days(self):
        """Asking to fill empty days → fill_gaps."""
        text = "What should we do with those empty days between Rome and Florence?"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.fill_gaps

    # -- discover ----------------------------------------------------------

    async def test_discover_restaurants(self):
        """Looking for specific spots → discover."""
        text = "Know any good trattorias near the Trastevere area?"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.discover

    async def test_discover_activities(self):
        """Asking about things to do → discover."""
        text = "What are some cool hikes near the Amalfi coast?"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.discover

    # -- refine ------------------------------------------------------------

    async def test_refine_detail(self):
        """Asking for more detail on a specific part → refine."""
        text = "Can you flesh out the Florence days? I want a morning-by-morning plan"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.refine

    # -- preference --------------------------------------------------------

    async def test_sharing_preferences(self):
        """User sharing tastes → preference."""
        text = (
            "Things we loved on past trips:\n"
            "- the Uffizi blew our minds\n"
            "- street food in Bangkok\n"
            "- renting bikes in Amsterdam"
        )
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node == GraphNode.preference

    # -- none / general ----------------------------------------------------

    async def test_casual_chat_returns_none(self):
        """Generic chat → none (no override)."""
        text = "Thanks!"
        node = await _detect_user_intent(text, _state_with_anchors())
        assert node is None


# ===================================================================
# Preference extraction
# ===================================================================

class TestPreferenceExtraction:
    """Verify the LLM extracts preference signals from varied messages."""

    async def test_explicit_list_of_past_highlights(self):
        """User lists past trip highlights → likes + past_experiences."""
        text = (
            "Things we enjoyed on previous trips:\n"
            "- a contemporary art museum in a field of trees\n"
            "- mountain biking downhill from a volcano\n"
            "- multi-day canyon trek\n"
            "- an underground bunker turned art gallery\n"
            "- flea market in a grungy neighbourhood\n"
            "- hidden jazz bar in Southeast Asia"
        )
        memory = _empty_memory()
        state = _empty_state()
        await _extract_preference_signals(text, memory, state)

        # Should have extracted several like tags
        assert len(memory.learned_likes) >= 3
        # Should have some past experiences
        assert len(memory.past_trip_examples) >= 3
        # Should have stored in trip context too
        assert len(state.trip_context.liked_examples) >= 3

    async def test_implicit_preferences_from_booking(self):
        """Booking details can imply preferences."""
        text = "We booked a ryokan with private onsen in a mountain village"
        memory = _empty_memory()
        await _extract_preference_signals(text, memory, _empty_state())

        all_likes = " ".join(memory.learned_likes.keys())
        # Should pick up something related to traditional/onsen/mountains
        assert any(kw in all_likes for kw in ("onsen", "ryokan", "traditional", "mountain"))

    async def test_dislikes_extracted(self):
        """Explicit dislikes should be captured."""
        text = "We really don't want tourist traps or crowded bus tours"
        memory = _empty_memory()
        await _extract_preference_signals(text, memory, _empty_state())

        assert len(memory.learned_dislikes) >= 1
        all_dislikes = " ".join(memory.learned_dislikes.keys())
        assert any(kw in all_dislikes for kw in ("tourist", "crowded", "bus"))

    async def test_mixed_likes_and_dislikes(self):
        """Message with both positive and negative signals."""
        text = (
            "We love local street food and hole-in-the-wall restaurants, "
            "but hate fancy fine dining and Michelin stuff"
        )
        memory = _empty_memory()
        await _extract_preference_signals(text, memory, _empty_state())

        assert len(memory.learned_likes) >= 1
        assert len(memory.learned_dislikes) >= 1

    async def test_pure_logistics_no_signals(self):
        """A purely logistical message should not produce preferences."""
        text = "We arrive at 3pm on June 5th and our hotel checkout is at 11am"
        memory = _empty_memory()
        await _extract_preference_signals(text, memory, _empty_state())

        assert len(memory.learned_likes) == 0
        assert len(memory.learned_dislikes) == 0
        assert len(memory.past_trip_examples) == 0

    async def test_subtle_preference_from_question(self):
        """Even a question can reveal preferences."""
        text = "Are there any good spots for landscape photography near the coast?"
        memory = _empty_memory()
        await _extract_preference_signals(text, memory, _empty_state())

        all_likes = " ".join(memory.learned_likes.keys())
        assert any(kw in all_likes for kw in ("photography", "landscape", "coast", "nature"))

    async def test_activity_style_preferences(self):
        """Pace and style preferences."""
        text = "We prefer walking everywhere over taking buses, and we like lazy mornings"
        memory = _empty_memory()
        await _extract_preference_signals(text, memory, _empty_state())

        assert len(memory.learned_likes) >= 1

    async def test_accumulation_across_messages(self):
        """Preferences should accumulate, not replace."""
        memory = _empty_memory()
        state = _empty_state()

        await _extract_preference_signals("We love hiking and nature", memory, state)
        first_count = len(memory.learned_likes)
        assert first_count >= 1

        await _extract_preference_signals("Also really into contemporary art and architecture", memory, state)
        assert len(memory.learned_likes) > first_count
