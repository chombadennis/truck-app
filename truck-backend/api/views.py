
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from .models import RegionalRule, Driver, Truck, Trip, DutyEvent
from .serializers import RegionalRuleSerializer
from .hos_engine import compute_trip_plan
from datetime import datetime


def health_check(request):
    """
    A simple endpoint to verify that the service is up and running.
    Used by external monitoring to prevent the service from sleeping.
    """
    return HttpResponse("OK", status=200)


class RegionalRuleListView(ListAPIView):
    """
    Provides a read-only endpoint to list all available RegionalRules.
    The frontend will use this to populate the rules dropdown.
    """
    queryset = RegionalRule.objects.all().order_by('name', 'cycle_type')
    serializer_class = RegionalRuleSerializer


class PlanTripView(APIView):
    def post(self, request):
        """
        Handles the trip planning request based on a selected regional rule.
        Always creates new Driver and Truck records for each trip.
        """
        data = request.data
        metadata = data.get("metadata", {}) # <-- Extract the nested metadata object

        # 1. Get and validate the RegionalRule from the dropdown selection
        regional_rule_id = data.get('regional_rule_id')
        if not regional_rule_id:
            return Response({"error": "regional_rule_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            regional_rule = RegionalRule.objects.get(pk=regional_rule_id)
        except RegionalRule.DoesNotExist:
            return Response({"error": f"RegionalRule with id {regional_rule_id} not found"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Always create a new Driver record for this trip
        driver = Driver.objects.create(
            name=metadata.get('driverName', 'Unnamed Driver'), # <-- FIX: Use correct key from metadata
            cycle_type=regional_rule.cycle_type, # Set cycle based on the rule
            timezone=metadata.get('timezone', 'UTC') # <-- FIX: Use correct key from metadata
        )

        # 3. Always create a new Truck record for this trip
        truck = Truck.objects.create(
            vin=metadata.get('vehicleId', 'VIN not provided'), # <-- FIX: Use correct key from metadata
            year=2024, # Year is not in the form, so we keep a default
            make='DefaultMake', # Make is not in the form
            model='DefaultModel' # Model is not in the form
        )

        # 4. Pass the correct cycle_type to the HOS engine
        # The engine needs the cycle_type in the main data dictionary
        data['cycle_type'] = regional_rule.cycle_type
        plan = compute_trip_plan(data, driver_obj=driver)

        if 'error' in plan:
            # If the HOS engine returns an error, forward it to the user
            return Response(plan, status=status.HTTP_400_BAD_REQUEST)

        # 5. Create the main Trip record
        trip_start_time = data.get('start_time')
        trip = Trip.objects.create(
            driver=driver,
            truck=truck,
            regional_rule_used=regional_rule,
            start_time=datetime.fromisoformat(trip_start_time.replace("Z", "+00:00")) if trip_start_time else datetime.now(),
            start_location=data.get('start_location_name', 'N/A'), # <-- FIX: Save the actual location name
            pickup_location=data.get('pickup_location_name', 'N/A'), # <-- FIX: Save the actual location name
            dropoff_location=data.get('dropoff_location_name', 'N/A'), # <-- FIX: Save the actual location name
            distance_miles=plan.get('route', {}).get('distance_miles'),
            route_geojson=plan.get('route', {}).get('geojson'),
            estimated_minutes=plan.get('route', {}).get('duration_minutes')
        )

        # 6. Create the DutyEvent records from the plan
        for event_data in plan.get('events', []):
            DutyEvent.objects.create(
                trip=trip,
                timestamp=datetime.fromisoformat(event_data['timestamp']),
                status=event_data['status'],
                duration_minutes=event_data['duration_minutes'],
                location=event_data.get('location', ''),
                miles_at_event=event_data.get('miles')
            )
        
        # 7. Add the rule info to the response for the frontend title
        plan['regional_rule_display'] = str(regional_rule)

        return Response(plan, status=status.HTTP_200_OK)
