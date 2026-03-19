"""Discover node — find spots using preference-weighted search + LLM."""

from __future__ import annotations

import uuid

from ..models import GraphResponse, SuggestionOption, TripState, UserMemory
from ..services.llm import call_llm_json, is_configured


DISCOVER_SYSTEM_PROMPT = """You are a friendly, opinionated travel buddy who knows great spots.

Based on the user's preferences and trip context, suggest specific places and activities.

For each suggestion, explain WHY it matches them — be specific and personal:
- "The brutalist gallery wing here is wild — right up your alley"
- "Locals-only izakaya, no English menu, incredible yakitori"
- "Short ridge hike with views of the whole bay, easy morning trip"

If the user has high adventurousness (4-5), prioritize hidden gems and local favorites.
If low (1-2), stick to well-known, reliable spots.
Medium (3) is a balanced mix.

Return ONLY valid JSON with keys:
- message (string): a SHORT, casual message (2-3 sentences max). Talk like a knowledgeable friend — be direct, skip formalities, don't recite their preferences back. Just say what you found and why it's cool.
- options (array, 3-6 items): discovered spots. Each has:
  - title (string)
  - kind (string): place | restaurant | event | activity | museum | hike | market
  - city (string)
  - reason (string): specific reason referencing user preferences
  - tags (array of strings)
  - reasoning (string): detailed explanation of why this matches the user"""


async def run_discover(state: TripState, user_text: str, memory: UserMemory) -> GraphResponse:
    """Discover spots matching user preferences."""
    if not is_configured():
        return _heuristic_discover(state, memory, user_text)

    likes = sorted(memory.learned_likes.items(), key=lambda x: x[1], reverse=True)[:10]
    dislikes = list(memory.learned_dislikes.keys())[:5]
    adventurousness = state.expert_settings.adventurousness
    liked_examples = state.trip_context.liked_examples + memory.past_trip_examples
    seen = set()
    liked_examples = [x for x in liked_examples if not (x in seen or seen.add(x))]

    existing_stops = ", ".join(s.title for s in state.planned_stops[:10]) or "none yet"

    context = (
        f"TRIP: {state.trip_context.primary_destination}, "
        f"{state.trip_context.start_date} to {state.trip_context.end_date}\n"
        f"LIKES: {', '.join(t for t, _ in likes) if likes else 'not yet known'}\n"
        f"DISLIKES: {', '.join(dislikes) if dislikes else 'none'}\n"
        f"PAST TRIP HIGHLIGHTS: {', '.join(liked_examples) if liked_examples else 'none shared'}\n"
        f"MUST INCLUDE: {', '.join(state.trip_context.must_include) if state.trip_context.must_include else 'none'}\n"
        f"AVOID: {', '.join(state.trip_context.avoid) if state.trip_context.avoid else 'none'}\n"
        f"ADVENTUROUSNESS: {adventurousness}/5 "
        f"({'mainstream/reliable' if adventurousness <= 2 else 'hidden gems/local favorites' if adventurousness >= 4 else 'balanced mix'})\n"
        f"ALREADY PLANNED: {existing_stops}"
    )

    # Include recent conversation for context
    recent = state.conversation[-6:]
    messages = [
        {"role": "system", "content": DISCOVER_SYSTEM_PROMPT},
    ]
    for msg in recent:
        messages.append({"role": msg.role, "content": msg.text})
    messages.append({"role": "user", "content": context})

    try:
        parsed = await call_llm_json(messages)
        options = [
            SuggestionOption(
                id=f"disc-{uuid.uuid4().hex[:8]}",
                title=str(opt.get("title", "")),
                kind=str(opt.get("kind", "place")),
                city=str(opt.get("city", "")),
                reason=str(opt.get("reason", "")),
                tags=[str(t) for t in opt.get("tags", [])],
                reasoning=str(opt.get("reasoning", "")),
            )
            for opt in parsed.get("options", [])
            if opt.get("title")
        ]
        return GraphResponse(
            assistant_message=str(parsed.get("message", "Here's what I found for you:")),
            options=options,
            trip_state=state,
            next_node=state.graph_node,
            suggested_action="Love, skip, or soft-add these spots.",
        )
    except Exception:
        return _heuristic_discover(state, memory, user_text)


def _heuristic_discover(state: TripState, memory: UserMemory, user_text: str) -> GraphResponse:
    """Fallback discover without LLM."""
    dest = state.trip_context.primary_destination or "your destination"
    interests = state.profile.interests[:3]
    interest_str = ", ".join(interests) if interests else "exploring"

    return GraphResponse(
        assistant_message=(
            f"I'd love to find specific spots for {interest_str} in {dest}. "
            f"Could you tell me which area or city you'd like to explore? "
            f"Or describe what you're in the mood for."
        ),
        trip_state=state,
        next_node=state.graph_node,
        suggested_action=f"Tell me what area of {dest} to explore.",
    )
