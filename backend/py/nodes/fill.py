"""Fill node — fill open gaps between hard points, big to small."""

from __future__ import annotations

import uuid

from ..models import GraphResponse, SuggestionOption, TripGap, TripState, UserMemory
from ..nodes.assess import find_open_gaps
from ..services.llm import call_llm_json, is_configured


FILL_SYSTEM_PROMPT = """You are a friendly, opinionated travel buddy helping someone plan their trip.

Given a gap between two anchor points, suggest activities/stops to fill it.
Consider the traveler's preferences, the location, and the time available.

Fill from big to small:
- Multi-day gaps: suggest a route with main stops/cities
- City stays: suggest day outlines (morning/afternoon/evening)
- Short gaps: suggest specific activities/events

Return ONLY valid JSON with keys:
- message (string): a SHORT, casual message (2-3 sentences max). Talk like a knowledgeable friend, not a tour guide. Be direct: "You've got 4 days in Tokyo — here's what I'd do" not "You have a 4-day window based in Tokyo (2026-04-27 noon → 2026-05-01 noon). Based on your stated likes...". Never list dates in ISO format, never recite their preferences back at them, never say "based on your stated likes". Just jump to the good stuff.
- options (array, 3-6 items): suggested stops/activities. Each has:
  - title (string)
  - kind (string): route-stop | day-outline | activity | event | restaurant
  - city (string)
  - reason (string): why this fits the user (reference their preferences)
  - tags (array of strings)
  - date (string, YYYY-MM-DD or "")
  - start_hint (string, HH:MM or "morning" | "afternoon" | "evening")"""


async def run_fill(state: TripState, user_text: str, memory: UserMemory) -> GraphResponse:
    """Fill the largest open gap with suggestions."""
    gaps = find_open_gaps(state)
    if not gaps:
        return GraphResponse(
            assistant_message="No open gaps found — your trip is looking solid!",
            trip_state=state,
            next_node=state.graph_node,
            suggested_action="You could refine details or explore specific areas.",
        )

    gap = gaps[0]  # Largest gap first

    if not is_configured():
        return _heuristic_fill(state, gap)

    # Build context as readable text, not a raw dict dump
    likes = list(memory.learned_likes.keys())[:10]
    dislikes = list(memory.learned_dislikes.keys())[:5]
    liked_examples = state.trip_context.liked_examples + memory.past_trip_examples
    # dedupe
    seen = set()
    liked_examples = [x for x in liked_examples if not (x in seen or seen.add(x))]

    anchors = "\n".join(
        f"  - {hp.title} ({hp.location}, {hp.start.strftime('%b %d')})"
        for hp in state.hard_points
    )

    context = (
        f"TRIP: {state.trip_context.primary_destination}, "
        f"{state.trip_context.start_date} to {state.trip_context.end_date}\n"
        f"GAP TO FILL: {gap.days} days, {gap.start.strftime('%b %d %H:%M')} → "
        f"{gap.end.strftime('%b %d %H:%M')}, near {gap.location or 'unknown'}\n"
        f"ANCHORS:\n{anchors}\n"
        f"LIKES: {', '.join(likes) if likes else 'not yet known'}\n"
        f"DISLIKES: {', '.join(dislikes) if dislikes else 'none'}\n"
        f"PAST TRIP HIGHLIGHTS: {', '.join(liked_examples) if liked_examples else 'none shared'}\n"
        f"MUST INCLUDE: {', '.join(state.trip_context.must_include) if state.trip_context.must_include else 'none'}\n"
        f"AVOID: {', '.join(state.trip_context.avoid) if state.trip_context.avoid else 'none'}\n"
        f"PACE: {state.profile.pace or 'balanced'}, "
        f"ADVENTUROUSNESS: {state.expert_settings.adventurousness}/5"
    )

    # Include recent conversation so the LLM has context
    recent = state.conversation[-6:]
    messages = [
        {"role": "system", "content": FILL_SYSTEM_PROMPT},
    ]
    for msg in recent:
        messages.append({"role": msg.role, "content": msg.text})
    messages.append({"role": "user", "content": context})

    try:
        parsed = await call_llm_json(messages)
        options = [
            SuggestionOption(
                id=f"fill-{uuid.uuid4().hex[:8]}",
                title=str(opt.get("title", "")),
                kind=str(opt.get("kind", "activity")),
                city=str(opt.get("city", "")),
                reason=str(opt.get("reason", "")),
                tags=[str(t) for t in opt.get("tags", [])],
            )
            for opt in parsed.get("options", [])
            if opt.get("title")
        ]
        return GraphResponse(
            assistant_message=str(parsed.get("message", f"Here are ideas for your {gap.days}-day gap:")),
            options=options,
            trip_state=state,
            next_node=state.graph_node,
            suggested_action="Love or skip these, then I'll fill the next gap.",
            gaps=gaps,
        )
    except Exception:
        return _heuristic_fill(state, gap)


def _heuristic_fill(state: TripState, gap: TripGap) -> GraphResponse:
    """Fallback fill without LLM."""
    msg = (
        f"You have a {gap.days}-day gap"
        f"{f' near {gap.location}' if gap.location else ''}. "
    )
    if gap.days > 3:
        msg += "That's a good chunk of time — want me to suggest a route with multiple stops?"
    elif gap.days > 1:
        msg += "I could suggest a day-by-day outline for this stretch."
    else:
        msg += "Let me find some activities to fill this time."

    return GraphResponse(
        assistant_message=msg,
        trip_state=state,
        next_node=state.graph_node,
        suggested_action="Tell me what kind of activities you'd like here.",
    )
