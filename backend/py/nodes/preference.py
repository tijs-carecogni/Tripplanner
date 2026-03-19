"""Preference node — build user preference profile through questions."""

from __future__ import annotations

import uuid

from ..models import GraphNode, GraphResponse, SuggestionOption, TripState, UserMemory
from ..services.llm import call_llm_json, is_configured


PREFERENCE_SYSTEM_PROMPT = """You are a trip-planning assistant learning about the traveler's preferences.

Based on the current trip context and what you already know about the user, generate:
1. A friendly message acknowledging what you know so far
2. 1-2 preference-building questions to understand their taste better
3. Example options that help you gauge their preferences

Return ONLY valid JSON with keys:
- message (string): friendly acknowledgment + questions
- options (array, 2-4 items): example activities/places to gauge taste. Each has:
  - title (string)
  - kind (string): activity type
  - city (string)
  - reason (string): why you're suggesting this to gauge preference
  - tags (array of strings)

Questions should be conversational: "What was your favourite travel memory?",
"Do you prefer packed days or lazy mornings?", "Name a place that blew your mind."
The user can also say "skip" to move on."""


async def run_preference(state: TripState, user_text: str, memory: UserMemory) -> GraphResponse:
    """Ask preference-building questions or process preference answers."""
    # Check if user wants to skip
    lower = user_text.lower()
    if any(skip in lower for skip in ("skip", "just plan", "go ahead", "don't ask")):
        state.graph_node = GraphNode.fill_gaps
        return GraphResponse(
            assistant_message="No problem — I'll work with what I know and learn as we go!",
            trip_state=state,
            next_node=GraphNode.fill_gaps,
            suggested_action="Moving to planning.",
        )

    if not is_configured():
        return _heuristic_preference(state, memory)

    context = {
        "destination": state.trip_context.primary_destination,
        "dates": f"{state.trip_context.start_date} to {state.trip_context.end_date}",
        "known_interests": state.profile.interests,
        "liked_examples": state.trip_context.liked_examples,
        "must_include": state.trip_context.must_include,
        "avoid": state.trip_context.avoid,
        "learned_likes": list(memory.learned_likes.keys())[:10],
        "user_message": user_text,
    }

    messages = [
        {"role": "system", "content": PREFERENCE_SYSTEM_PROMPT},
        {"role": "user", "content": str(context)},
    ]

    try:
        parsed = await call_llm_json(messages)
        options = [
            SuggestionOption(
                id=f"pref-{uuid.uuid4().hex[:8]}",
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
            assistant_message=str(parsed.get("message", "Tell me more about what you enjoy!")),
            options=options,
            trip_state=state,
            next_node=state.graph_node,
            suggested_action="Answer the questions or say 'skip' to start planning.",
        )
    except Exception:
        return _heuristic_preference(state, memory)


def _heuristic_preference(state: TripState, memory: UserMemory) -> GraphResponse:
    """Fallback preference questions without LLM."""
    known = []
    if state.profile.interests:
        known.append(f"interests: {', '.join(state.profile.interests)}")
    if memory.learned_likes:
        top = sorted(memory.learned_likes, key=memory.learned_likes.get, reverse=True)[:5]
        known.append(f"you seem to like: {', '.join(top)}")

    msg_parts = []
    if known:
        msg_parts.append(f"So far I know: {'; '.join(known)}.")
    msg_parts.append(
        "To plan better, tell me:\n"
        "- What was your favourite travel memory?\n"
        "- Do you prefer packed days or lazy mornings?\n"
        "- Name a place or experience that blew your mind.\n\n"
        "Or say 'skip' to start planning with what I know."
    )

    return GraphResponse(
        assistant_message=" ".join(msg_parts),
        trip_state=state,
        next_node=state.graph_node,
        suggested_action="Share preferences or skip",
    )
