"""Pydantic models for Driftplan trip state, user memory, and graph responses."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class HardPointType(str, Enum):
    flight = "flight"
    train = "train"
    hotel = "hotel"
    tour = "tour"
    meeting = "meeting"
    no_planning = "no-planning"


class GraphNode(str, Enum):
    scaffold = "scaffold"
    assess = "assess"
    preference = "preference"
    fill_gaps = "fill_gaps"
    discover = "discover"
    refine = "refine"
    idle = "idle"


# ---------------------------------------------------------------------------
# Core trip items
# ---------------------------------------------------------------------------

class HardPoint(BaseModel):
    id: str
    title: str
    type: HardPointType = HardPointType.flight
    start: datetime
    end: datetime | None = None
    location: str = ""
    lat: float | None = None
    lng: float | None = None
    booking_ref: str = ""
    notes: str = ""
    locked: bool = True


class SoftPOI(BaseModel):
    id: str
    title: str
    city: str = ""
    tags: list[str] = []
    reason: str = ""
    lat: float | None = None
    lng: float | None = None
    start_hint: str = ""


class PlannedStop(BaseModel):
    id: str
    title: str
    city: str = ""
    tags: list[str] = []
    reason: str = ""
    lat: float | None = None
    lng: float | None = None
    date: str = ""
    start: str = ""
    source_kind: str = ""


class RouteNode(BaseModel):
    id: str
    title: str
    type: str = "city-hub"
    location: str = ""
    lat: float | None = None
    lng: float | None = None
    start: str = ""
    notes: str = ""


class RouteSet(BaseModel):
    id: str
    name: str
    description: str = ""
    active: bool = True
    nodes: list[RouteNode] = []


# ---------------------------------------------------------------------------
# Trip context & preferences
# ---------------------------------------------------------------------------

class TripContext(BaseModel):
    primary_destination: str = ""
    start_date: str = ""
    end_date: str = ""
    must_include: list[str] = []
    avoid: list[str] = []
    style_notes: str = ""
    liked_examples: list[str] = []


class ExpertSettings(BaseModel):
    planner_mode: str = "expert-balanced"
    suggestion_count: int = 12
    daily_stop_target: int = 3
    hard_point_buffer_hours: float = 1.5
    event_intensity: int = 3
    transport_bias: str = "balanced"
    group_by_day: bool = True
    map_auto_fit: bool = True
    map_focus_mode: str = "trip-core"
    adventurousness: int = 3  # 1=mainstream, 5=hidden gems


class Profile(BaseModel):
    name: str = ""
    home_base: str = ""
    budget: str = "mid"
    pace: str = "balanced"
    interests: list[str] = []


# ---------------------------------------------------------------------------
# Conversation
# ---------------------------------------------------------------------------

class Message(BaseModel):
    id: str
    role: str  # "user" | "assistant"
    text: str
    when: str = ""
    options: list[SuggestionOption] = []


class SuggestionOption(BaseModel):
    id: str
    title: str
    kind: str = "activity"
    city: str = ""
    reason: str = ""
    tags: list[str] = []
    lat: float | None = None
    lng: float | None = None
    location_query: str = ""
    score: float | None = None
    reasoning: str = ""  # WHY this was suggested


# ---------------------------------------------------------------------------
# User memory (persists across trips)
# ---------------------------------------------------------------------------

class UserMemory(BaseModel):
    user_id: str
    learned_likes: dict[str, float] = {}
    learned_dislikes: dict[str, float] = {}
    tag_scores: dict[str, float] = {}
    city_scores: dict[str, float] = {}
    ratings_history: list[dict[str, Any]] = []
    past_trip_examples: list[str] = []


# ---------------------------------------------------------------------------
# Outline
# ---------------------------------------------------------------------------

class OutlineBlock(BaseModel):
    id: str
    label: str
    day_range: str = ""
    summary: str = ""
    tags: list[str] = []


class OutlineDraft(BaseModel):
    blocks: list[OutlineBlock] = []
    strategies: list[dict[str, Any]] = []
    general_strategy: str = ""


# ---------------------------------------------------------------------------
# Gap analysis
# ---------------------------------------------------------------------------

class TripGap(BaseModel):
    start: datetime
    end: datetime
    location: str = ""
    type: str = "open"  # open | partial | city-stay
    days: float = 0
    hard_point_before: str | None = None
    hard_point_after: str | None = None


# ---------------------------------------------------------------------------
# Full trip state
# ---------------------------------------------------------------------------

class TripState(BaseModel):
    trip_id: str = "default"
    user_id: str = "default"
    graph_node: GraphNode = GraphNode.scaffold
    profile: Profile = Profile()
    trip_context: TripContext = TripContext()
    hard_points: list[HardPoint] = []
    soft_pois: list[SoftPOI] = []
    planned_stops: list[PlannedStop] = []
    route_sets: list[RouteSet] = []
    conversation: list[Message] = []
    outline_draft: OutlineDraft = OutlineDraft()
    expert_settings: ExpertSettings = ExpertSettings()


# ---------------------------------------------------------------------------
# Graph response (what the backend returns to the frontend after each action)
# ---------------------------------------------------------------------------

class GraphResponse(BaseModel):
    assistant_message: str
    options: list[SuggestionOption] = []
    trip_state: TripState
    next_node: GraphNode
    suggested_action: str = ""
    gaps: list[TripGap] = []


# ---------------------------------------------------------------------------
# API request models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    user_id: str = "default"
    trip_id: str = "default"
    text: str


class FeedbackRequest(BaseModel):
    user_id: str = "default"
    trip_id: str = "default"
    item_id: str
    feedback: str  # "love" | "maybe" | "no" | rating 1-5
    tags: list[str] = []


class HardPointRequest(BaseModel):
    user_id: str = "default"
    trip_id: str = "default"
    hard_point: HardPoint
