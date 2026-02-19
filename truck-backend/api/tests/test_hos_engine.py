from django.test import TestCase
from api.hos_engine import compute_trip_plan
from datetime import datetime

class HOSEngineTests(TestCase):
    def test_basic_short_trip(self):
        payload = {
            "start_coords": [-97.7431, 30.2672],
            "dropoff_coords": [-95.3698, 29.7604],
            "start_time": "2025-09-15T08:00:00Z",
            "cycle_type": "70/8",
            "driven_today_minutes": 0,
            "on_duty_today_minutes": 0,
            "rolling_history": []
        }
        out = compute_trip_plan(payload)
        self.assertIn("route", out)
        self.assertIn("events", out)
