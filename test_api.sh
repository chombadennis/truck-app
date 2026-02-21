#!/bin/bash
curl -X POST https://us-central1-truck-app-b61c0.cloudfunctions.net/api/plan-trip/ \
-H "Content-Type: application/json" \
-d '{
    "driver_id": 1,
    "current_location": "Reno, NV",
    "pickup_location": "Salt Lake City, UT",
    "dropoff_location": "Denver, CO",
    "start_time": "2025-09-12T08:00:00Z",
    "cycle_type": "70/8",
    "rolling_history": [8.0, 9.5, 7.0, 8.5, 9.0, 6.0, 7.5]
}'
