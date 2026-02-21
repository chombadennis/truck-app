from rest_framework import serializers
from .models import Trip, DutyEvent, Driver, RegionalRule # Import RegionalRule

# Add the new serializer for the RegionalRule model
class RegionalRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalRule
        fields = ['id', 'name', 'cycle_type']

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'

class DutyEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutyEvent
        fields = '__all__'

class TripSerializer(serializers.ModelSerializer):
    events = DutyEventSerializer(many=True, read_only=True)
    class Meta:
        model = Trip
        fields = '__all__'
