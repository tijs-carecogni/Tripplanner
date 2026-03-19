"""Driftplan FastAPI backend — graph-based trip planning agent."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

# Load .env file if present (for local dev)
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .graph import run_graph
from .models import (
    ChatRequest,
    FeedbackRequest,
    GraphResponse,
    HardPoint,
    HardPointRequest,
    PlannedStop,
    SoftPOI,
    TripState,
)
from .storage import load_memory, load_trip, save_memory, save_trip

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).resolve().parent.parent.parent  # Tripplanner/
app = FastAPI(title="Driftplan", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"ok": True, "service": "driftplan-backend"}


@app.post("/api/chat", response_model=GraphResponse)
async def chat(req: ChatRequest):
    """Send a user message through the planning graph."""
    state = load_trip(req.user_id, req.trip_id)
    memory = load_memory(req.user_id)

    response = await run_graph(state, req.text, memory)

    save_trip(response.trip_state)
    save_memory(memory)

    return response


@app.get("/api/trip/{user_id}/{trip_id}", response_model=TripState)
async def get_trip(user_id: str, trip_id: str):
    """Get current trip state."""
    return load_trip(user_id, trip_id)


@app.put("/api/trip/{user_id}/{trip_id}/hardpoint")
async def add_hard_point(user_id: str, trip_id: str, req: HardPointRequest):
    """Manually add a hard point."""
    state = load_trip(user_id, trip_id)
    state.hard_points.append(req.hard_point)
    save_trip(state)
    return {"ok": True, "hard_point_id": req.hard_point.id}


@app.delete("/api/trip/{user_id}/{trip_id}/hardpoint/{hp_id}")
async def remove_hard_point(user_id: str, trip_id: str, hp_id: str):
    """Remove a hard point."""
    state = load_trip(user_id, trip_id)
    state.hard_points = [hp for hp in state.hard_points if hp.id != hp_id]
    save_trip(state)
    return {"ok": True}


@app.post("/api/trip/{user_id}/{trip_id}/reset")
async def reset_trip(user_id: str, trip_id: str):
    """Reset trip to a blank state (keeps user memory)."""
    state = TripState(trip_id=trip_id, user_id=user_id)
    save_trip(state)
    return {"ok": True}


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    """Record user feedback on a suggestion."""
    memory = load_memory(req.user_id)
    state = load_trip(req.user_id, req.trip_id)

    # Find the option in conversation
    option = None
    for msg in reversed(state.conversation):
        for opt in msg.options:
            if opt.id == req.item_id:
                option = opt
                break
        if option:
            break

    if not option:
        return {"ok": False, "error": "Option not found"}

    # Update memory based on feedback
    if req.feedback == "love":
        for tag in option.tags:
            memory.learned_likes[tag] = memory.learned_likes.get(tag, 0) + 2
    elif req.feedback == "maybe":
        for tag in option.tags:
            memory.learned_likes[tag] = memory.learned_likes.get(tag, 0) + 0.5
    elif req.feedback == "no":
        for tag in option.tags:
            memory.learned_dislikes[tag] = memory.learned_dislikes.get(tag, 0) + 2

    # Record in history
    memory.ratings_history.append({
        "item_id": req.item_id,
        "feedback": req.feedback,
        "tags": req.tags or option.tags,
        "title": option.title,
    })
    if len(memory.ratings_history) > 200:
        memory.ratings_history = memory.ratings_history[-200:]

    save_memory(memory)
    return {"ok": True}


@app.post("/api/trip/{user_id}/{trip_id}/soft-add")
async def soft_add(user_id: str, trip_id: str, option_id: str):
    """Soft-add an option as a tentative POI."""
    state = load_trip(user_id, trip_id)

    # Find option
    option = None
    for msg in reversed(state.conversation):
        for opt in msg.options:
            if opt.id == option_id:
                option = opt
                break
        if option:
            break

    if not option:
        return {"ok": False, "error": "Option not found"}

    poi = SoftPOI(
        id=f"poi-{uuid.uuid4().hex[:8]}",
        title=option.title,
        city=option.city,
        tags=option.tags,
        reason=option.reason,
        lat=option.lat,
        lng=option.lng,
    )
    state.soft_pois.append(poi)
    save_trip(state)
    return {"ok": True, "poi_id": poi.id}


@app.post("/api/trip/{user_id}/{trip_id}/hard-add")
async def hard_add(user_id: str, trip_id: str, option_id: str):
    """Promote an option to a planned stop."""
    state = load_trip(user_id, trip_id)

    option = None
    for msg in reversed(state.conversation):
        for opt in msg.options:
            if opt.id == option_id:
                option = opt
                break
        if option:
            break

    if not option:
        return {"ok": False, "error": "Option not found"}

    stop = PlannedStop(
        id=f"stop-{uuid.uuid4().hex[:8]}",
        title=option.title,
        city=option.city,
        tags=option.tags,
        reason=option.reason,
        lat=option.lat,
        lng=option.lng,
        source_kind="conversation-option",
    )
    state.planned_stops.append(stop)
    save_trip(state)
    return {"ok": True, "stop_id": stop.id}


@app.get("/api/user/{user_id}/memory")
async def get_memory(user_id: str):
    """Get user preference memory."""
    memory = load_memory(user_id)
    return memory.model_dump()


# ---------------------------------------------------------------------------
# Static files — serve the frontend
# ---------------------------------------------------------------------------

@app.get("/")
async def index():
    return FileResponse(ROOT_DIR / "index.html")


# Mount static files last so API routes take priority
app.mount("/", StaticFiles(directory=str(ROOT_DIR)), name="static")
