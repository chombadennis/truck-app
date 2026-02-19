import os
import math
import requests
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
from django.core.cache import cache  # requires Django cache setup

ORS_API_KEY = os.getenv("ORS_API_KEY")  # optional OpenRouteService key
GEOCODING_ENABLED = os.getenv("GEOCODING_ENABLED", "True") == "True"

# In-memory cache for reverse geocoding
_geocode_cache: Dict[Tuple[int, int], str] = {}

# -----------------
# Utility Functions
# -----------------
def parse_iso(dt_str: Optional[str]) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc)
    s = dt_str
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)

def minutes_to_td(mins: int) -> timedelta:
    return timedelta(minutes=int(mins))

def td_to_minutes(td: timedelta) -> int:
    return int(td.total_seconds() // 60)

# -----------------
# Routing
# -----------------
def fetch_route_geojson(coords: List[List[float]]) -> Dict[str, Any]:
    if ORS_API_KEY and len(coords) >= 2:
        try:
            url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
            headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}
            body = {"coordinates": coords, "instructions": False}
            r = requests.post(url, json=body, headers=headers, timeout=30)
            r.raise_for_status()
            data = r.json()
            feat = data["features"][0]
            props = feat.get("properties", {})
            segments = props.get("segments", [])
            total_distance = 0.0
            total_duration = 0.0
            legs = []
            if segments:
                for seg in segments:
                    d = seg.get("distance", 0.0)
                    dur = seg.get("duration", 0.0)
                    legs.append({"distance_meters": d, "duration_seconds": dur})
                    total_distance += d
                    total_duration += dur
            else:
                total_distance = props.get("summary", {}).get("distance", 0.0)
                total_duration = props.get("summary", {}).get("duration", 0.0)
                legs = [{"distance_meters": total_distance, "duration_seconds": total_duration}]
            geometry = feat.get("geometry", {})
            geometry_coords = geometry.get("coordinates") if geometry else coords
            return {
                "geojson": geometry,
                "distance_m": total_distance,
                "duration_s": total_duration,
                "legs": legs,
                "geometry_coords": geometry_coords,
            }
        except Exception as e:
            print("ORS fetch failed, falling back to haversine:", e)

    # ---- fallback haversine route ----
    def haversine_m(a, b):
        R = 6371000.0
        lon1, lat1 = math.radians(a[0]), math.radians(a[1])
        lon2, lat2 = math.radians(b[0]), math.radians(b[1])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        x = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x))
        return R * c

    geometry_coords = coords[:]
    total = 0.0
    legs = []
    for i in range(len(coords) - 1):
        d = haversine_m(coords[i], coords[i + 1])
        dur_h = (d / 1609.344) / 60.0 if d > 0 else 0.0
        legs.append({"distance_meters": d, "duration_seconds": dur_h * 3600.0})
        total += d
    duration_s = sum(l["duration_seconds"] for l in legs)
    geo = {"type": "LineString", "coordinates": geometry_coords}
    return {
        "geojson": geo,
        "distance_m": total,
        "duration_s": duration_s,
        "legs": legs,
        "geometry_coords": geometry_coords,
    }

# -----------------
# Geometry helpers
# -----------------
def segment_lengths_m(coords: List[List[float]]) -> List[float]:
    def haversine_m(a, b):
        R = 6371000.0
        lon1, lat1 = math.radians(a[0]), math.radians(a[1])
        lon2, lat2 = math.radians(b[0]), math.radians(b[1])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        x = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x))
        return R * c
    return [haversine_m(coords[i], coords[i + 1]) for i in range(len(coords) - 1)]

def coord_at_distance(coords: List[List[float]], target_m: float) -> List[float]:
    if not coords:
        return [0.0, 0.0]
    if target_m <= 0:
        return coords[0]
    segs = segment_lengths_m(coords)
    total = sum(segs)
    if total == 0 or target_m >= total:
        return coords[-1]
    acc = 0.0
    for i, seg_len in enumerate(segs):
        if acc + seg_len >= target_m:
            frac = (target_m - acc) / seg_len if seg_len > 0 else 0.0
            a, b = coords[i], coords[i + 1]
            lng = a[0] + frac * (b[0] - a[0])
            lat = a[1] + frac * (b[1] - a[1])
            return [round(lng, 6), round(lat, 6)]
        acc += seg_len
    return coords[-1]

# -----------------
# Reverse Geocoding
# -----------------
def reverse_geocode(lng: float, lat: float) -> str:
    if not GEOCODING_ENABLED:
        return f"{lat:.3f},{lng:.3f}"
    key = (int(round(lat * 1000)), int(round(lng * 1000)))
    if key in _geocode_cache:
        return _geocode_cache[key]
    cache_key = f'geocode:{key[0]}:{key[1]}'.replace(" ", "")
    cached = cache.get(cache_key)
    if cached:
        _geocode_cache[key] = cached
        return cached
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {"lat": lat, "lon": lng, "format": "json", "zoom": 10, "addressdetails": 1}
        headers = {"User-Agent": "truck-hos-app/1.0 (example@example.com)"}
        r = requests.get(url, params=params, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        addr = data.get("address", {})
        city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county")
        state = addr.get("state") or addr.get("state_district")
        result = None
        if city and state:
            result = f"{city}, {state}"
        elif city:
            result = city
        elif state:
            result = state
        else:
            result = data.get("display_name", f"{lat:.3f},{lng:.3f}")
        _geocode_cache[key] = result
        cache.set(cache_key, result, timeout=60 * 60 * 24 * 30)
        return result
    except Exception:
        return f"{lat:.3f},{lng:.3f}"

# -----------------
# HOS Simulation
# -----------------
def compute_trip_plan(request_data: Dict[str, Any], driver_obj=None) -> Dict[str, Any]:
    coords_input = []
    for key in ("start_coords", "pickup_coords", "dropoff_coords"):
        if key in request_data and request_data[key]:
            coords_input.append(request_data[key])
    if len(coords_input) < 2:
        return {"error": "Please supply at least start_coords and dropoff_coords"}

    start_time = parse_iso(request_data.get("start_time"))
    cycle_type = request_data.get("cycle_type", "70/8")
    driven_today = int(request_data.get("driven_today_minutes", 0))
    on_duty_today = int(request_data.get("on_duty_today_minutes", 0))
    rolling_history = request_data.get("rolling_history", []) or []

    route = fetch_route_geojson(coords_input)
    geometry_coords = route.get("geometry_coords") or []
    total_distance_m = float(route.get("distance_m", 0.0))
    total_distance_miles = total_distance_m / 1609.344 if total_distance_m else 0.0
    total_duration_minutes = int(route.get("duration_s", 0.0) // 60)

    # Constants
    MAX_DRIVE_MIN = 11 * 60
    WINDOW_MIN = 14 * 60
    BREAK_AFTER_MIN = 8 * 60
    MIN_BREAK_MIN = 30
    TEN_HOUR_OFF_MIN = 10 * 60
    THIRTYFOUR_OFF_MIN = 34 * 60

    cycle_limit_hours = 70 if cycle_type == "70/8" else 60
    cycle_limit_minutes = cycle_limit_hours * 60
    rolling_minutes = sum(int(h * 60) for h in rolling_history) + on_duty_today

    events: List[Dict[str, Any]] = []
    current_time = start_time
    cumulative_driving_since_break = 0
    driven_today_local = driven_today
    on_duty_today_local = on_duty_today
    distance_done_m = 0.0
    next_fuel_mile = 1000.0

    last_sleeper_start: Optional[datetime] = None

    def current_location_coords(dist_done_m: float) -> List[float]:
        if geometry_coords and sum(segment_lengths_m(geometry_coords)) > 0:
            return coord_at_distance(geometry_coords, dist_done_m)
        if dist_done_m <= 0:
            return coords_input[0]
        return coords_input[-1]

    def make_event(status: str, ts: datetime, duration_min: int, miles_val: Optional[float], note: str, qualifying_break: bool = False):
        nonlocal distance_done_m
        loc_coords = current_location_coords(distance_done_m)
        lng, lat = loc_coords[0], loc_coords[1]
        location_str = reverse_geocode(lng, lat)
        return {
            "status": status,
            "timestamp": ts.isoformat(),
            "duration_minutes": int(duration_min),
            "miles": round(miles_val, 2) if miles_val is not None else None,
            "note": note,
            "location": location_str,
            "location_coords": loc_coords,
            "qualifying_break": qualifying_break,
        }

    for leg_idx, leg in enumerate(route.get("legs", [])):
        leg_dist_m = float(leg.get("distance_meters", 0.0))
        leg_dur_min = int(round(leg.get("duration_seconds", 0.0) / 60.0))
        remaining = leg_dur_min

        while remaining > 0:
            if rolling_minutes >= cycle_limit_minutes:
                ev = make_event("OFF", current_time, THIRTYFOUR_OFF_MIN, round(distance_done_m / 1609.344, 2), "34hr_restart", qualifying_break=True)
                events.append(ev)
                current_time += minutes_to_td(THIRTYFOUR_OFF_MIN)
                rolling_minutes = 0
                driven_today_local = 0
                cumulative_driving_since_break = 0
                start_time = current_time
                continue

            if (distance_done_m / 1609.344) >= next_fuel_mile:
                ev = make_event("OFF", current_time, 60, round(distance_done_m / 1609.344, 2), "Fuel Stop", qualifying_break=True)
                events.append(ev)
                current_time += minutes_to_td(60)
                next_fuel_mile += 1000
                cumulative_driving_since_break = 0
                continue

            available_by_11 = max(0, MAX_DRIVE_MIN - driven_today_local)
            elapsed_since_start = td_to_minutes(current_time - start_time)
            available_by_14 = max(0, WINDOW_MIN - elapsed_since_start)

            if cumulative_driving_since_break >= BREAK_AFTER_MIN:
                ev = make_event("OFF", current_time, MIN_BREAK_MIN, round(distance_done_m / 1609.344, 2), "30min_break_required", qualifying_break=True)
                events.append(ev)
                current_time += minutes_to_td(MIN_BREAK_MIN)
                cumulative_driving_since_break = 0
                continue

            if available_by_11 == 0 or available_by_14 == 0:
                if last_sleeper_start and (current_time - last_sleeper_start) >= minutes_to_td(8 * 60):
                    ev = make_event("OFF", current_time, 2 * 60, round(distance_done_m / 1609.344, 2), "2hr_split", qualifying_break=True)
                    events.append(ev)
                    current_time += minutes_to_td(2 * 60)
                    driven_today_local = 0
                    cumulative_driving_since_break = 0
                    start_time = current_time
                    last_sleeper_start = None
                    continue
                else:
                    ev = make_event("SLEEPER", current_time, 8 * 60, round(distance_done_m / 1609.344, 2), "8hr_split", qualifying_break=True)
                    events.append(ev)
                    last_sleeper_start = current_time
                    current_time += minutes_to_td(8 * 60)
                    cumulative_driving_since_break = 0
                    continue

            allowed = min(remaining, available_by_11, available_by_14)
            if allowed <= 0:
                ev = make_event("OFF", current_time, MIN_BREAK_MIN, round(distance_done_m / 1609.344, 2), "safety_pause", qualifying_break=True)
                events.append(ev)
                current_time += minutes_to_td(MIN_BREAK_MIN)
                cumulative_driving_since_break = 0
                continue

            portion = allowed / max(1, leg_dur_min)
            dist_portion = leg_dist_m * portion
            distance_done_m += dist_portion
            ev = make_event("DRIVE", current_time, allowed, round(distance_done_m / 1609.344, 2), f"leg_{leg_idx}_drive", qualifying_break=False)
            events.append(ev)

            current_time += minutes_to_td(allowed)
            remaining -= allowed
            driven_today_local += allowed
            cumulative_driving_since_break += allowed
            on_duty_today_local += allowed
            rolling_minutes += allowed

            # Check pickup/dropoff 1h stop
            if leg_idx == 0 and leg_idx + 1 == len(route.get("legs", [])):
                if leg_idx == 0:
                    ev_pd = make_event("ON", current_time, 60, round(distance_done_m / 1609.344, 2), "Pickup/Dropoff Stop", qualifying_break=True)
                    events.append(ev_pd)
                    current_time += minutes_to_td(60)
                    cumulative_driving_since_break = 0

    return {
        "route": route_summary(route, total_distance_miles, total_duration_minutes),
        "events": events,
        "summary": {
            "driven_today_minutes": driven_today_local,
            "on_duty_today_minutes": on_duty_today_local,
            "rolling_minutes": rolling_minutes,
        },
    }

def route_summary(route: Dict[str, Any], distance_miles: float, duration_minutes: int) -> Dict[str, Any]:
    return {
        "distance_miles": round(distance_miles, 2),
        "duration_minutes": int(duration_minutes),
        "geojson": route.get("geojson"),
        "geometry_coords": route.get("geometry_coords"),
        "legs": route.get("legs", []),
    }
