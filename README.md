# Tripplanner - MindTrip Hard-Point Planner

A lightweight MindTrip-like travel planner focused on:

- **Hard points first** (flights, booked hotels, fixed appointments, paid tickets)
- **Route node sets** (main stops you can activate one-by-one or combine)
- **Memory development** (learns your likes/dislikes from ratings)
- **Personalized suggestions** (and custom ideas you can add/rate)
- **Map + itinerary visualization**
- **Main location + trip discovery**
- **Event discovery**
- **Interleaving flexible stops between hard points**
- **LLM-based natural-language search**
- **Context-driven LLM itinerary builder** (fills windows around hard points)
- **Conversational preference loop** (clarify, suggest options, collect feedback, refine memory)
- **Route comparison** (driving/cycling/walking, including alternatives where available)

## Features

### 1) Hard Point Planning (Most Important)
- Add locked trip points with date/time, location, booking reference, and notes.
- Designed for non-negotiable plans (flight departures, check-ins, booked tours).
- Hard points are sorted into a timeline itinerary and connected on the map.

### 2) Traveler Memory Model
- Save traveler profile: name, home base, budget style, travel pace, interests.
- Rate hard points, suggestions, and events (1-5).
- Memory engine updates preference weights by tag and city.
- Personalized recommendations improve over time from rating history.

### 3) Suggestion System
- Seeded catalog of trip ideas with tags and travel style metadata.
- Personalized ranking score based on memory + profile match.
- Add your own custom suggestions and rate them.
- Pin suggestions directly as new hard points.

### 4) Main Locations, Trips, and Interleaving
- Search for major locations (POIs) and trip ideas around a city/area.
- Results can be either:
  - **interleaved** as flexible stops in the timeline, or
  - **locked** as hard points.
- Interleaved locations/trips/events are merged chronologically with hard points in one itinerary.

### 5) Two-level Route Planning (MindTrip-style)
- **Level 1 (Route level):** create route node sets (main stops/hubs).
- Activate a single set or combine multiple sets to build alternative route skeletons.
- Active route nodes are:
  - shown on the map,
  - merged into itinerary timeline,
  - usable as route planner anchors.
- **Level 2 (Detail level):** search and add specific places/events (hikes, shops, bars, concerts, architecture, museums, etc.) around your route.
- Combined search returns both levels together so planning stays coherent.

### 6) Event Finder
- Search by city/area, date, and radius.
- Combines seeded event data with nearby venue discovery.
- Rate events to improve memory.
- Add events either as interleaved stops or locked hard points.

### 7) LLM-based Search
- Configure any OpenAI-compatible endpoint + model + API key.
- Ask natural language queries (e.g. "interleave food spots and evening music between my hard points").
- LLM returns mixed suggestions (`main-location`, `event`, `trip`) that can be:
  - interleaved in itinerary,
  - locked as hard points, or
  - rated for memory learning.

### 8) User + Trip Context Driven Itinerary Generation
- Save explicit trip context (trip range, destination, must-include, avoid, style notes).
- Planner computes **free windows around hard points**.
- LLM can generate itinerary parts specifically for those windows while preserving hard-point constraints.
- Generated items are inserted as flexible itinerary stops and can replace prior generated parts.

### 9) Conversational Copilot (Long-form preference discovery)
- Multi-turn conversation to clarify ambiguous user preferences.
- Suggests multiple options in each turn and captures feedback (`Love / Maybe / No`).
- Feedback updates user memory (likes/dislikes tags) and fine-tunes future suggestions.
- Supports **side-track mode** for deep dives into activities, then returning to **main planning** while carrying learned signals.
- Conversation insights are included in the itinerary generation context.

### 10) Route Comparison (Google Maps-style concept)
- Compare multiple route profiles: driving, cycling, walking.
- Support:
  - point-to-point hard point comparison
  - whole-trip hard point route comparison
- Shows distance and ETA per profile and visualizes all routes on map.

## Run Locally

No build step is required.

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Files

- `index.html` - app layout and UI sections
- `styles.css` - styling and responsive layout
- `app.js` - app orchestration, state transitions, UI handlers, planner workflows
- `src/constants.js` - static configuration and seeded travel data catalogs
- `src/utils.js` - shared utility helpers (IDs, tags, date/time, distance, formatting)

## Notes

- Browser `localStorage` is used to persist profile, hard points, interleaved stops, memory scores, ratings, and custom suggestions.
- LLM API key is stored in browser localStorage for convenience in this MVP.
- External map/routing/geocoding data depends on availability of public services.
