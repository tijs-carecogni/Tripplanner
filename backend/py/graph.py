"""Planning graph — LangGraph-like state machine for trip planning."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from .models import GraphNode, GraphResponse, Message, TripState, UserMemory
from .nodes.assess import assess_context, find_open_gaps
from .nodes.discover import run_discover
from .nodes.fill import run_fill
from .nodes.preference import run_preference
from .nodes.refine import run_refine
from .nodes.scaffold import run_scaffold
from .services.llm import call_llm_json, is_configured


async def run_graph(state: TripState, user_text: str, memory: UserMemory) -> GraphResponse:
    """Run one step of the planning graph based on current state + user input.

    The graph:
    1. Records the user message
    2. Checks if the user is giving a direct command (skip, add hard point, etc.)
    3. Assesses trip state to determine current node
    4. Runs the appropriate node
    5. Records the assistant response
    6. Returns the full response for the frontend
    """
    # Record user message
    state.conversation.append(Message(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="user",
        text=user_text,
        when=datetime.now(timezone.utc).isoformat(),
    ))

    # Assess where we are in the planning flow
    next_node = assess_context(state)

    # Allow user to override: detect intent from text
    override = await _detect_user_intent(user_text, state)
    if override:
        next_node = override

    state.graph_node = next_node

    # Run main node and preference extraction concurrently
    response, _ = await asyncio.gather(
        _run_node(next_node, state, user_text, memory),
        _extract_preference_signals(user_text, memory, state),
    )

    # Record assistant message from this node
    state.conversation.append(Message(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="assistant",
        text=response.assistant_message,
        when=datetime.now(timezone.utc).isoformat(),
        options=response.options,
    ))

    # Auto-continue: if scaffold just ran and there's a next step, run it too
    post_node = assess_context(state)
    if post_node != next_node and next_node == GraphNode.scaffold and post_node in (
        GraphNode.preference, GraphNode.fill_gaps, GraphNode.discover
    ):
        state.graph_node = post_node
        continuation = await _run_node(post_node, state, "", memory)

        # Append continuation message
        state.conversation.append(Message(
            id=f"msg-{uuid.uuid4().hex[:8]}",
            role="assistant",
            text=continuation.assistant_message,
            when=datetime.now(timezone.utc).isoformat(),
            options=continuation.options,
        ))

        # Merge: use continuation's options but keep scaffold's message too
        response.assistant_message += "\n\n" + continuation.assistant_message
        response.options = continuation.options
        post_node = assess_context(state)

    state.graph_node = post_node
    response.next_node = post_node
    response.gaps = find_open_gaps(state)
    response.trip_state = state

    return response


async def _run_node(
    node: GraphNode,
    state: TripState,
    user_text: str,
    memory: UserMemory,
) -> GraphResponse:
    """Dispatch to the correct node handler."""
    if node == GraphNode.scaffold:
        return await run_scaffold(state, user_text)
    elif node == GraphNode.preference:
        return await run_preference(state, user_text, memory)
    elif node == GraphNode.fill_gaps:
        return await run_fill(state, user_text, memory)
    elif node == GraphNode.discover:
        return await run_discover(state, user_text, memory)
    elif node == GraphNode.refine:
        return await run_refine(state, user_text, memory)
    else:
        # Default: try to figure out what the user wants
        return await _handle_general(state, user_text, memory)


async def _handle_general(state: TripState, user_text: str, memory: UserMemory) -> GraphResponse:
    """Handle general messages when we're not sure which node to use."""
    if not is_configured():
        return GraphResponse(
            assistant_message="What would you like to work on? I can fill gaps, find new spots, or add detail to your plan.",
            trip_state=state,
            next_node=GraphNode.idle,
            suggested_action="Tell me what part of the trip to focus on.",
        )

    # Use LLM to understand intent and respond appropriately
    context = {
        "trip_state_summary": {
            "destination": state.trip_context.primary_destination,
            "dates": f"{state.trip_context.start_date} to {state.trip_context.end_date}",
            "hard_points": len(state.hard_points),
            "planned_stops": len(state.planned_stops),
            "soft_pois": len(state.soft_pois),
        },
        "user_message": user_text,
        "recent_messages": [
            {"role": m.role, "text": m.text}
            for m in state.conversation[-6:]
        ],
    }

    messages = [
        {"role": "system", "content": (
            "You are a trip-planning assistant. The user sent a message. "
            "Respond helpfully based on the trip context. "
            "Return JSON with keys: message (string), suggested_action (string)."
        )},
        {"role": "user", "content": str(context)},
    ]

    try:
        parsed = await call_llm_json(messages)
        return GraphResponse(
            assistant_message=str(parsed.get("message", "How can I help with your trip?")),
            trip_state=state,
            next_node=GraphNode.idle,
            suggested_action=str(parsed.get("suggested_action", "")),
        )
    except Exception:
        return GraphResponse(
            assistant_message="What would you like to work on next?",
            trip_state=state,
            next_node=GraphNode.idle,
            suggested_action="Tell me what to focus on.",
        )


INTENT_SYSTEM_PROMPT = """You are a router for a trip-planning assistant. Classify the user's message into one action.

Current trip state:
- Has hard points (anchors): {has_anchors}
- Has planned stops: {has_stops}
- Destination: {destination}

Actions:
- "scaffold": User is adding trip structure (flights, hotels, dates, bookings) OR correcting/updating existing anchors ("sorry, actually we fly from...", "change the hotel to...")
- "preference": User is sharing what they like/dislike or answering preference questions
- "fill_gaps": User wants you to fill open time in their itinerary, plan the trip, create an outline, or says "skip"/"go ahead"/"just plan"
- "discover": User wants to explore/find specific places, restaurants, activities, or asks "what about..."
- "refine": User wants more detail on a specific part of the plan ("tell me more about day 3", "flesh out the Kyoto part")
- "none": Message doesn't clearly match any action, or is just chatting

Return ONLY valid JSON: {{"action": "scaffold"|"preference"|"fill_gaps"|"discover"|"refine"|"none"}}"""

_INTENT_TO_NODE = {
    "scaffold": GraphNode.scaffold,
    "preference": GraphNode.preference,
    "fill_gaps": GraphNode.fill_gaps,
    "discover": GraphNode.discover,
    "refine": GraphNode.refine,
}


async def _detect_user_intent(text: str, state: TripState) -> GraphNode | None:
    """Use LLM to classify user intent into a graph node."""
    if not is_configured() or len(text.strip()) < 3:
        return None

    prompt = INTENT_SYSTEM_PROMPT.format(
        has_anchors=bool(state.hard_points),
        has_stops=bool(state.planned_stops),
        destination=state.trip_context.primary_destination or "not set",
    )

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": text},
    ]

    try:
        parsed = await call_llm_json(messages, reasoning_effort="medium")
        action = str(parsed.get("action", "none")).lower()
        return _INTENT_TO_NODE.get(action)
    except Exception as exc:
        import logging
        logging.warning("Intent detection failed: %s", exc)
        return None


PREFERENCE_EXTRACT_PROMPT = """Extract travel preferences from this user message. The user is planning a trip and chatting with a planner.

Look for ANY signal about what they like, dislike, or have enjoyed — whether stated directly or implied. Examples:
- "museum insel hombroich" → likes: art, museums, architecture, nature-art
- "mtb downhill from volcano" → likes: adventure, mountain-biking, active
- "cool jazz cafe in chiang mai" → likes: jazz, nightlife, local-atmosphere
- "I hate tourist traps" → dislikes: touristy, crowded
- "we prefer walking over buses" → likes: walking, dislikes: bus-tours
- "not a beach person" → dislikes: beach
- "the food in Osaka was incredible" → past_experiences: "food in Osaka", likes: food, street-food

Return ONLY valid JSON:
{
  "likes": ["tag1", "tag2"],
  "dislikes": ["tag1"],
  "past_experiences": ["short description of specific place/activity they enjoyed"],
  "has_signals": true
}

Rules:
- "likes" and "dislikes" should be short lowercase tags (1-3 words) that can be reused across suggestions
- "past_experiences" should be the actual experience described, kept short (e.g. "museum insel hombroich", "hiking colca canyon")
- Set "has_signals" to false if the message contains NO preference info (e.g. pure logistics like "we arrive at 3pm")
- Don't invent preferences — only extract what's actually in the message"""


async def _extract_preference_signals(text: str, memory: UserMemory, state: TripState | None = None) -> None:
    """Use LLM to extract preference signals from any user message."""
    if not is_configured() or len(text.strip()) < 10:
        return

    messages = [
        {"role": "system", "content": PREFERENCE_EXTRACT_PROMPT},
        {"role": "user", "content": text},
    ]

    try:
        parsed = await call_llm_json(messages, reasoning_effort="medium")
    except Exception as exc:
        import logging
        logging.warning("Preference extraction failed: %s", exc)
        return

    if not parsed.get("has_signals"):
        return

    ctx = state.trip_context if state else None

    for tag in parsed.get("likes", []):
        tag = str(tag).lower().strip()
        if tag and len(tag) > 1:
            memory.learned_likes[tag] = memory.learned_likes.get(tag, 0) + 1

    for tag in parsed.get("dislikes", []):
        tag = str(tag).lower().strip()
        if tag and len(tag) > 1:
            memory.learned_dislikes[tag] = memory.learned_dislikes.get(tag, 0) + 1

    for exp in parsed.get("past_experiences", []):
        exp = str(exp).strip()
        if exp and exp not in memory.past_trip_examples:
            memory.past_trip_examples.append(exp)
        if ctx and exp and exp not in ctx.liked_examples:
            ctx.liked_examples.append(exp)
