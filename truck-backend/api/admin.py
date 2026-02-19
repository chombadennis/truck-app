# api/admin.py
from django.contrib import admin
from .models import Driver, Trip, DutyEvent

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "cycle_type", "timezone")

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "driver", "start_time", "pickup_location", "dropoff_location")

@admin.register(DutyEvent)
class DutyEventAdmin(admin.ModelAdmin):
    list_display = ("id", "trip", "timestamp", "status", "duration_minutes")
