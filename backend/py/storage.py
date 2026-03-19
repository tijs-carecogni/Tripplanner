"""Simple JSON-file storage for trip state and user memory."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import TripState, UserMemory

DATA_DIR = Path(__file__).resolve().parent / "data"


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _trip_path(user_id: str, trip_id: str) -> Path:
    return DATA_DIR / f"trip_{user_id}_{trip_id}.json"


def _memory_path(user_id: str) -> Path:
    return DATA_DIR / f"memory_{user_id}.json"


# ---------------------------------------------------------------------------
# Trip state
# ---------------------------------------------------------------------------

def load_trip(user_id: str, trip_id: str) -> TripState:
    path = _trip_path(user_id, trip_id)
    if path.exists():
        raw = json.loads(path.read_text("utf-8"))
        return TripState.model_validate(raw)
    return TripState(trip_id=trip_id, user_id=user_id)


def save_trip(state: TripState) -> None:
    _ensure_dir()
    path = _trip_path(state.user_id, state.trip_id)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(state.model_dump_json(indent=2), "utf-8")
    tmp.replace(path)


# ---------------------------------------------------------------------------
# User memory (persists across trips)
# ---------------------------------------------------------------------------

def load_memory(user_id: str) -> UserMemory:
    path = _memory_path(user_id)
    if path.exists():
        raw = json.loads(path.read_text("utf-8"))
        return UserMemory.model_validate(raw)
    return UserMemory(user_id=user_id)


def save_memory(memory: UserMemory) -> None:
    _ensure_dir()
    path = _memory_path(memory.user_id)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(memory.model_dump_json(indent=2), "utf-8")
    tmp.replace(path)


# ---------------------------------------------------------------------------
# Trip listing
# ---------------------------------------------------------------------------

def list_trips(user_id: str) -> list[dict[str, Any]]:
    _ensure_dir()
    trips = []
    for path in DATA_DIR.glob(f"trip_{user_id}_*.json"):
        raw = json.loads(path.read_text("utf-8"))
        trips.append({
            "trip_id": raw.get("trip_id", ""),
            "destination": raw.get("trip_context", {}).get("primary_destination", ""),
            "start_date": raw.get("trip_context", {}).get("start_date", ""),
        })
    return sorted(trips, key=lambda t: t.get("start_date", ""), reverse=True)
