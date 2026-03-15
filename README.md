# Tripplanner - MindTrip Hard-Point Planner

A lightweight MindTrip-like travel planner focused on:

- **Hard points first** (flights, booked hotels, fixed appointments, paid tickets)
- **Memory development** (learns your likes/dislikes from ratings)
- **Personalized suggestions** (and custom ideas you can add/rate)
- **Map + itinerary visualization**
- **Event discovery**
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

### 4) Dual Visualization
- **Map view** with hard points, itinerary path, route comparison overlays, and event markers.
- **Itinerary view** with ordered stops and transit segment estimates.

### 5) Event Finder
- Search by city/area, date, and radius.
- Combines seeded event data with nearby venue discovery.
- Rate events to improve memory and pin events as hard points.

### 6) Route Comparison (Google Maps-style concept)
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
- `app.js` - state, memory engine, routing/events/geocoding integration, rendering logic

## Notes

- Browser `localStorage` is used to persist profile, hard points, memory scores, ratings, and custom suggestions.
- External map/routing/geocoding data depends on availability of public services.
