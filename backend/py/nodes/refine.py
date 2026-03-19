"""Refine node — add detail to partially planned legs."""

from __future__ import annotations

import uuid

from ..models import GraphResponse, SuggestionOption, TripState, UserMemory
from ..services.llm import call_llm_json, is_configured


REFINE_SYSTEM_PROMPT = """You are a trip-planning assistant adding detail to a partially planned trip leg.

The user has a rough plan but needs specifics: exact restaurants, timed events,
morning/afternoon/evening activities, local tips.

Return ONLY valid JSON with keys:
- message (string): what you're detailing and why
- options (array, 3-6 items): detailed suggestions with timing. Each has:
  - title (string)
  - kind (string): restaurant | event | activity | museum | hike | market | cafe | bar
  - city (string)
  - reason (string): why this fits, referencing user preferences
  - tags (array of strings)
  - start_hint (string): "morning" | "afternoon" | "evening" | specific time like "19:00"
  - reasoning (string): detailed match explanation"""


async def run_refine(state: TripState, user_text: str, memory: UserMemory) -> GraphResponse:
    """Refine a specific leg or the whole trip with details."""
    if not is_configured():
        return _heuristic_refine(state, user_text)

    likes = sorted(memory.learned_likes.items(), key=lambda x: x[1], reverse=True)[:10]

    context = {
        "destination": state.trip_context.primary_destination,
        "current_hard_points": [
            {"title": hp.title, "type": hp.type, "location": hp.location,
             "start": hp.start.isoformat()}
            for hp in sorted(state.hard_points, key=lambda h: h.start)
        ],
        "current_planned": [
            {"title": s.title, "city": s.city, "date": s.date}
            for s in state.planned_stops[:15]
        ],
        "soft_pois": [
            {"title": p.title, "city": p.city, "tags": p.tags}
            for p in state.soft_pois[:10]
        ],
        "interests": state.profile.interests,
        "liked_examples": state.trip_context.liked_examples,
        "learned_likes": [{"tag": t, "score": s} for t, s in likes],
        "adventurousness": state.expert_settings.adventurousness,
        "pace": state.profile.pace,
        "user_query": user_text,
    }

    messages = [
        {"role": "system", "content": REFINE_SYSTEM_PROMPT},
        {"role": "user", "content": str(context)},
    ]

    try:
        parsed = await call_llm_json(messages)
        options = [
            SuggestionOption(
                id=f"ref-{uuid.uuid4().hex[:8]}",
                title=str(opt.get("title", "")),
                kind=str(opt.get("kind", "activity")),
                city=str(opt.get("city", "")),
                reason=str(opt.get("reason", "")),
                tags=[str(t) for t in opt.get("tags", [])],
                reasoning=str(opt.get("reasoning", "")),
            )
            for opt in parsed.get("options", [])
            if opt.get("title")
        ]
        return GraphResponse(
            assistant_message=str(parsed.get("message", "Here are some details to flesh out your plan:")),
            options=options,
            trip_state=state,
            next_node=state.graph_node,
            suggested_action="Add the ones you like, skip the rest.",
        )
    except Exception:
        return _heuristic_refine(state, user_text)


def _heuristic_refine(state: TripState, user_text: str) -> GraphResponse:
    """Fallback refine without LLM."""
    planned_count = len(state.planned_stops) + len(state.soft_pois)
    return GraphResponse(
        assistant_message=(
            f"Your trip has {len(state.hard_points)} anchors and {planned_count} planned stops. "
            "Which part would you like to detail? Tell me a city or date range "
            "and I'll find specific activities, restaurants, and events."
        ),
        trip_state=state,
        next_node=state.graph_node,
        suggested_action="Pick a leg or city to detail.",
    )
