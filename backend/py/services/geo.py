"""Geocoding service using OpenStreetMap Nominatim."""

from __future__ import annotations

import httpx

_client = httpx.AsyncClient(timeout=10.0)
_cache: dict[str, tuple[float, float] | None] = {}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode(location: str) -> tuple[float, float] | None:
    """Return (lat, lng) for a location string, or None if not found."""
    if not location or not location.strip():
        return None

    key = location.strip().lower()
    if key in _cache:
        return _cache[key]

    try:
        resp = await _client.get(
            NOMINATIM_URL,
            params={"q": location, "format": "json", "limit": 1},
            headers={"User-Agent": "Driftplan/0.1 (trip planner)"},
        )
        resp.raise_for_status()
        results = resp.json()
        if results:
            lat = float(results[0]["lat"])
            lng = float(results[0]["lon"])
            _cache[key] = (lat, lng)
            return (lat, lng)
    except Exception:
        pass

    _cache[key] = None
    return None
