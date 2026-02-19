from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TripSerializer
from .models import Trip, Driver
from django.shortcuts import get_object_or_404
from .hos_engine import compute_trip_plan  # we'll implement this next

class PlanTripView(APIView):
    def post(self, request):
        """
        Expected JSON:
        {
          "driver_id": 1,
          "current_location": "City A",
          "pickup_location": "City B",
          "dropoff_location": "City C",
          "start_time": "2025-09-12T08:00:00Z",
          "cycle_type": "70/8",
          "rolling_history": [8.0, 9.5, ...] # hours on-duty previous days
        }
        """
        data = request.data
        driver = get_object_or_404(Driver, pk=data.get('driver_id'))
        plan = compute_trip_plan(data, driver)  # returns dict with route, events, eld_data
        return Response(plan, status=status.HTTP_200_OK)
