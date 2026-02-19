# generate_eld.py
import os
import requests
from datetime import datetime, timedelta
from pprint import pprint
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()  # looks for .env in the current folder

ORS_KEY = os.getenv("ORS_API_KEY")
if not ORS_KEY:
    raise ValueError("ORS_API_KEY not set in environment")

coords = [
    [-98.269192, 29.497273],  # Start
    [-98.284701, 29.500718],  # Pickup
    [-98.287296, 29.509856],  # Dropoff
]

resp = requests.post(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    headers={"Authorization": ORS_KEY, "Content-Type": "application/json"},
    json={"coordinates": coords}
)
route_data = resp.json()

print("Route retrieved successfully!")
print(f"Distance: {route_data['features'][0]['properties']['segments'][0]['distance']} meters")
print(f"Duration: {route_data['features'][0]['properties']['segments'][0]['duration']} seconds")

events = []
current_time = datetime.now()
current_miles = 0
total_distance_miles = route_data['features'][0]['properties']['segments'][0]['distance'] * 0.000621371
segment_distance = total_distance_miles / len(coords)

for i, coord in enumerate(coords):
    # Driving to next point
    if i > 0:
        drive_miles = segment_distance
        drive_hours = drive_miles / 50
        events.append({
            "type": "DRIVING",
            "start_time": current_time.isoformat(),
            "end_time": (current_time + timedelta(hours=drive_hours)).isoformat(),
            "miles": round(drive_miles, 1)
        })
        current_time += timedelta(hours=drive_hours)
        current_miles += drive_miles

        # Fuel stop every ~1000 miles
        if current_miles >= 1000:
            events.append({
                "type": "FUEL",
                "start_time": current_time.isoformat(),
                "end_time": (current_time + timedelta(minutes=30)).isoformat(),
                "miles": 0
            })
            current_time += timedelta(minutes=30)
            current_miles = 0

    # Pickup / Dropoff
    stop_type = "PICKUP" if i == 1 else "DROPOFF" if i == 2 else None
    if stop_type:
        events.append({
            "type": stop_type,
            "start_time": current_time.isoformat(),
            "end_time": (current_time + timedelta(hours=1)).isoformat(),
            "miles": 0
        })
        current_time += timedelta(hours=1)

pprint(events)
