"""Assess node — determines what the trip needs next."""

from __future__ import annotations

from datetime import datetime, timedelta

from ..models import GraphNode, TripGap, TripState


def find_open_gaps(state: TripState) -> list[TripGap]:
    """Find gaps at multiple levels:

    Level 1 — fully open: no hard points or plans for these days at all
    Level 2 — location known, no activities: hard point exists (e.g. hotel stay)
              but no activities/plans for specific days within that stay
    Level 3 — unspecified: hard point exists but is vague (e.g. "day trip - unspecified")
    """
    if not state.hard_points:
        return []

    sorted_hp = sorted(state.hard_points, key=lambda hp: hp.start)
    gaps: list[TripGap] = []

    # Collect all dates that have something planned
    planned_dates: set[str] = set()
    for stop in state.planned_stops:
        if stop.date:
            planned_dates.add(stop.date[:10])
    for poi in state.soft_pois:
        if poi.start_hint:
            planned_dates.add(poi.start_hint[:10])

    # Collect hard point date coverage
    hp_dates: dict[str, list] = {}  # date_str -> list of hard points on that day
    for hp in sorted_hp:
        date_str = str(hp.start)[:10]
        hp_dates.setdefault(date_str, []).append(hp)

    # Level 1: Fully open gaps between consecutive hard points
    for i in range(len(sorted_hp) - 1):
        hp_end = sorted_hp[i].end or sorted_hp[i].start
        hp_next_start = sorted_hp[i + 1].start
        delta = (hp_next_start - hp_end).total_seconds() / 86400

        if delta < 0.5:
            continue

        # Check if anything covers this window
        has_coverage = False
        check_date = hp_end
        while check_date < hp_next_start:
            ds = str(check_date)[:10]
            if ds in hp_dates or ds in planned_dates:
                has_coverage = True
                break
            check_date += timedelta(days=1)

        if not has_coverage:
            gaps.append(TripGap(
                start=hp_end,
                end=hp_next_start,
                location=sorted_hp[i].location,
                type="open",
                days=round(delta, 1),
                hard_point_before=sorted_hp[i].id,
                hard_point_after=sorted_hp[i + 1].id,
            ))

    # Level 3: Unspecified hard points (title contains "unspecified" or no real location)
    for hp in sorted_hp:
        title_lower = (hp.title or "").lower()
        loc_lower = (hp.location or "").lower()
        if "unspecified" in title_lower or "unspecified" in loc_lower:
            date_str = str(hp.start)[:10]
            if date_str not in planned_dates:
                gaps.append(TripGap(
                    start=hp.start,
                    end=hp.end or hp.start,
                    location=hp.location,
                    type="unspecified",
                    days=1,
                    hard_point_before=hp.id,
                    hard_point_after=None,
                ))

    # Level 2: Days within a stay that have no activities
    # Find hotel stays and check each day
    for hp in sorted_hp:
        if hp.type != "hotel" or not hp.end:
            continue
        stay_start = hp.start
        stay_end = hp.end
        stay_days = int((stay_end - stay_start).total_seconds() / 86400)
        if stay_days < 2:
            continue
        empty_days = 0
        for d in range(1, stay_days):  # skip first day (arrival)
            check = stay_start + timedelta(days=d)
            ds = str(check)[:10]
            if ds not in planned_dates and ds not in hp_dates:
                empty_days += 1
        if empty_days > 0:
            gaps.append(TripGap(
                start=stay_start + timedelta(days=1),
                end=stay_end,
                location=hp.location,
                type="no-activities",
                days=empty_days,
                hard_point_before=hp.id,
                hard_point_after=None,
            ))

    # Sort: fully open first, then unspecified, then no-activities
    type_order = {"open": 0, "unspecified": 1, "no-activities": 2}
    return sorted(gaps, key=lambda g: (type_order.get(g.type, 9), -g.days))


def assess_context(state: TripState) -> GraphNode:
    """Decide which graph node to go to next based on trip state."""
    # No scaffolding at all?
    if not state.hard_points and not state.trip_context.primary_destination:
        return GraphNode.scaffold

    # Missing critical trip context?
    if not state.trip_context.primary_destination or not state.trip_context.start_date:
        return GraphNode.scaffold

    # Enough user preferences? Cap at 2 preference rounds to avoid looping.
    has_prefs = (
        len(state.profile.interests) >= 2
        or len(state.trip_context.liked_examples) >= 2
        or len(state.trip_context.must_include) >= 2
    )
    # Count how many times we've already asked preference questions
    pref_msgs = sum(
        1 for m in state.conversation
        if m.role == "assistant" and "?" in (m.text or "")
        and ("prefer" in (m.text or "").lower() or "question" in (m.text or "").lower() or "tell me" in (m.text or "").lower())
    )
    if not has_prefs and pref_msgs < 2:
        return GraphNode.preference

    # Open gaps?
    gaps = find_open_gaps(state)
    if gaps:
        return GraphNode.fill_gaps

    # Has outline but could use detail?
    if state.planned_stops or state.soft_pois:
        return GraphNode.refine

    # Nothing planned yet even though context is complete
    return GraphNode.fill_gaps
