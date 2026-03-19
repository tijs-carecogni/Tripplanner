"""Scaffold node — extract hard points and trip context from user text."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from ..models import GraphResponse, HardPoint, Message, TripState


def _parse_dt(val: Any) -> datetime | None:
    """Parse a datetime string from LLM output, return None on failure."""
    if isinstance(val, datetime):
        return val
    if not val:
        return None
    try:
        return datetime.fromisoformat(str(val))
    except (ValueError, TypeError):
        return None
from ..services.geo import geocode
from ..services.llm import call_llm_json, is_configured


SCAFFOLD_SYSTEM_PROMPT_INITIAL = """You are a trip-planning assistant. Extract EVERY piece of structured trip information from the user's message.

The current year is 2026. When the user says "April 9" they mean 2026-04-09.

Be AGGRESSIVE about extraction. Every location mention, every date, every activity, every transit between places should become a hard_point. Even vague references like "day trip on the 11th" or "fly to X on the 23rd" should be extracted.

Return ONLY valid JSON with these keys:
- destination (string): primary country/region
- start_date (string, YYYY-MM-DD): trip start date
- end_date (string, YYYY-MM-DD): trip end date
- hard_points (array): EVERY scheduled item — stays, flights, trains, day trips, hikes, activities with dates. Extract ALL of them, not just hotels. Each has:
  - title (string): descriptive name
  - type (string): flight | train | hotel | tour | meeting | no-planning
  - start (string, ISO datetime YYYY-MM-DDTHH:MM:SS): use 12:00:00 if no time given
  - end (string, ISO datetime or ""): use checkout/end time if known
  - location (string): city or specific place name with country for geocoding (e.g. "Tokyo, Japan", "Naoshima, Japan")
- liked_examples (array of strings): past travel experiences the user mentions loving
- must_include (array of strings): activities/interests they want (e.g. "architecture", "food", "hiking")
- avoid (array of strings): things to avoid
- style_notes (string): vibe/pace preferences

IMPORTANT: Extract EVERY leg of the journey. If someone says "stay in Tokyo 5 nights, then Naoshima on the 19th, fly to Ishigaki on 23rd, back to Tokyo 26th" — that is at LEAST 4 hard points (Tokyo stay, Naoshima visit, flight to Ishigaki, return to Tokyo). Day trips, hikes, and specific activities with dates are also hard points."""


SCAFFOLD_SYSTEM_PROMPT_UPDATE = """You are a trip-planning assistant. The user already has hard points in their trip. They are sending a correction or addition.

The current year is 2026. When the user says "April 9" they mean 2026-04-09.

CRITICAL RULES:
- ONLY return hard points that are CHANGING. Do NOT re-list existing hard points that are unchanged.
- If the user corrects something (e.g. "sorry, we fly from Fukuoka" or "the hotel is on the 15th not 14th"), find the matching existing hard point and return it with action "update".
- If the user adds something genuinely new, return it with action "add".
- If the user says something is wrong/cancelled, return it with action "remove".
- An EMPTY hard_points array is valid if nothing needs to change.

Return ONLY valid JSON with these keys:
- destination (string or ""): only if changed
- start_date (string, YYYY-MM-DD, or ""): only if changed
- end_date (string, YYYY-MM-DD, or ""): only if changed
- hard_points (array): ONLY the hard points that need to change. Each has:
  - id (string or null): the existing id if updating/removing, null if adding new
  - action (string): "add" | "update" | "remove"
  - title (string): descriptive name
  - type (string): flight | train | hotel | tour | meeting | no-planning
  - start (string, ISO datetime YYYY-MM-DDTHH:MM:SS): use 12:00:00 if no time given
  - end (string, ISO datetime or ""): use checkout/end time if known
  - location (string): city or specific place name with country for geocoding
- liked_examples (array of strings): only new ones
- must_include (array of strings): only new ones
- avoid (array of strings): only new ones
- style_notes (string): only if changed"""


async def run_scaffold(state: TripState, user_text: str) -> GraphResponse:
    """Parse user text to extract trip scaffolding."""
    import logging
    logging.warning("scaffold: is_configured=%s", is_configured())
    if not is_configured():
        logging.warning("scaffold: LLM not configured, using heuristic")
        return _heuristic_scaffold(state, user_text)

    # Pick prompt: initial extraction vs. update/correction
    if state.hard_points:
        system_prompt = SCAFFOLD_SYSTEM_PROMPT_UPDATE
        existing = "\n".join(
            f"  - id={hp.id}, title={hp.title}, type={hp.type}, "
            f"start={hp.start}, end={hp.end}, location={hp.location}"
            for hp in state.hard_points
        )
        user_prompt = (
            f"EXISTING HARD POINTS:\n{existing}\n\n"
            f"USER MESSAGE:\n{user_text}"
        )
    else:
        system_prompt = SCAFFOLD_SYSTEM_PROMPT_INITIAL
        user_prompt = user_text

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        parsed = await call_llm_json(messages)
        _apply_parsed(state, parsed)
    except Exception as exc:
        import logging
        logging.exception("Scaffold LLM failed: %s", exc)
        return _heuristic_scaffold(state, user_text)

    # Geocode hard points that lack coordinates
    for hp in state.hard_points:
        if hp.lat is None and hp.location:
            coords = await geocode(hp.location)
            if coords:
                hp.lat, hp.lng = coords

    # Build response — keep it brief and natural
    ctx = state.trip_context
    n = len(state.hard_points)
    if ctx.primary_destination and ctx.start_date:
        summary = f"Got it — {ctx.primary_destination}, {ctx.start_date}"
        if ctx.end_date:
            summary += f" to {ctx.end_date}"
        summary += f", {n} anchor{'s' if n != 1 else ''} locked in."
    elif ctx.primary_destination:
        summary = f"Got it — {ctx.primary_destination}, {n} anchor{'s' if n != 1 else ''} locked in."
    else:
        summary = "Tell me more about your trip."

    return GraphResponse(
        assistant_message=summary,
        trip_state=state,
        next_node=state.graph_node,
        suggested_action="Let me check what else I need to know.",
    )


def _apply_parsed(state: TripState, parsed: dict[str, Any]) -> None:
    """Apply parsed LLM output to trip state."""
    ctx = state.trip_context
    if parsed.get("destination"):
        ctx.primary_destination = str(parsed["destination"])
    if parsed.get("start_date"):
        ctx.start_date = str(parsed["start_date"])
    if parsed.get("end_date"):
        ctx.end_date = str(parsed["end_date"])
    for tag in parsed.get("must_include", []):
        if tag and str(tag) not in ctx.must_include:
            ctx.must_include.append(str(tag))
    for tag in parsed.get("avoid", []):
        if tag and str(tag) not in ctx.avoid:
            ctx.avoid.append(str(tag))
    if parsed.get("style_notes"):
        ctx.style_notes = str(parsed["style_notes"])
    for ex in parsed.get("liked_examples", []):
        if ex and str(ex) not in ctx.liked_examples:
            ctx.liked_examples.append(str(ex))

    # Build lookup of existing hard points by id
    existing_by_id = {hp.id: hp for hp in state.hard_points}

    for hp_raw in parsed.get("hard_points", []):
        action = str(hp_raw.get("action", "add")).lower()
        raw_id = hp_raw.get("id") or ""

        if action == "remove" and raw_id in existing_by_id:
            state.hard_points = [hp for hp in state.hard_points if hp.id != raw_id]
            continue

        if not hp_raw.get("title"):
            continue

        if action == "update" and raw_id in existing_by_id:
            # Update existing hard point in place
            hp = existing_by_id[raw_id]
            hp.title = str(hp_raw["title"])
            hp.type = str(hp_raw.get("type", hp.type))
            if hp_raw.get("start"):
                parsed_start = _parse_dt(hp_raw["start"])
                if parsed_start:
                    hp.start = parsed_start
            if hp_raw.get("end"):
                parsed_end = _parse_dt(hp_raw["end"])
                if parsed_end:
                    hp.end = parsed_end
            if hp_raw.get("location"):
                hp.location = str(hp_raw["location"])
            # Clear coords so they get re-geocoded with the new location
            hp.lat = None
            hp.lng = None
        else:
            # New hard point
            hp = HardPoint(
                id=f"hp-{uuid.uuid4().hex[:8]}",
                title=str(hp_raw["title"]),
                type=str(hp_raw.get("type", "hotel")),
                start=hp_raw.get("start", ""),
                end=hp_raw.get("end") or None,
                location=str(hp_raw.get("location", "")),
            )
            state.hard_points.append(hp)


def _heuristic_scaffold(state: TripState, user_text: str) -> GraphResponse:
    """Fallback: just store the text and ask for more info."""
    state.conversation.append(Message(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="user",
        text=user_text,
    ))
    return GraphResponse(
        assistant_message=(
            "I'd love to help plan your trip! To get started, could you tell me:\n"
            "- Where are you going?\n"
            "- What dates?\n"
            "- Any flights or hotels already booked?"
        ),
        trip_state=state,
        next_node=state.graph_node,
        suggested_action="Provide trip basics",
    )
