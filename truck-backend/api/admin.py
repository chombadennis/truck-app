# api/admin.py
from django.contrib import admin
# Add RegionalRule to the import
from .models import Driver, Trip, DutyEvent, Truck, RegionalRule

@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    list_display = ("id", "vin", "year", "make", "model")

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "cycle_type", "timezone")

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "driver", "start_time", "pickup_location", "dropoff_location")

@admin.register(DutyEvent)
class DutyEventAdmin(admin.ModelAdmin):
    list_display = ("id", "trip", "timestamp", "status", "duration_minutes")

# Add the new admin registration for RegionalRule
@admin.register(RegionalRule)
class RegionalRuleAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "cycle_type")
