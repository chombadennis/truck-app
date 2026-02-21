
from django.db import models

# New model for Regional HOS Rules
class RegionalRule(models.Model):
    name = models.CharField(max_length=100, help_text="e.g., North America")
    cycle_type = models.CharField(max_length=10, choices=[('70/8', '70/8'), ('60/7', '60/7')])

    class Meta:
        unique_together = ('name', 'cycle_type')

    def __str__(self):
        return f"{self.name} ({self.cycle_type})"

# Modified Truck model
class Truck(models.Model):
    # As requested, vin is not unique to allow creating a new truck for every trip.
    vin = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.vin}) - ID: {self.id}"

# Unchanged Driver model
class Driver(models.Model):
    name = models.CharField(max_length=200)
    cycle_type = models.CharField(max_length=10, choices=(('70/8','70/8'),('60/7','60/7')), default='70/8')
    timezone = models.CharField(max_length=50, default='UTC')

    def __str__(self):
        return self.name

# Modified Trip model
class Trip(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE)
    # Added link to the Truck for this trip
    truck = models.ForeignKey(Truck, on_delete=models.CASCADE, null=True) # Set null=True temporarily for migration
    # Added link to the rule used for this trip
    regional_rule_used = models.ForeignKey(RegionalRule, on_delete=models.SET_NULL, null=True, blank=True)

    start_time = models.DateTimeField()
    start_location = models.CharField(max_length=250)
    pickup_location = models.CharField(max_length=250)
    dropoff_location = models.CharField(max_length=250)
    distance_miles = models.FloatField(null=True, blank=True)
    route_geojson = models.JSONField(null=True, blank=True)
    estimated_minutes = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Trip {self.id} by {self.driver}"

# Unchanged DutyEvent model
class DutyEvent(models.Model):
    STATUS_CHOICES = [
        ('OFF', 'Off Duty'),
        ('SLEEPER', 'Sleeper'),
        ('DRIVE', 'Driving'),
        ('ON', 'On Duty Not Driving')
    ]
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='events')
    timestamp = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    duration_minutes = models.IntegerField()
    location = models.CharField(max_length=250, blank=True)
    miles_at_event = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.status} @ {self.timestamp}"
