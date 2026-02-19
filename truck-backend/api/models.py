from django.db import models

class Driver(models.Model):
    name = models.CharField(max_length=200)
    cycle_type = models.CharField(max_length=10, choices=(('70/8','70/8'),('60/7','60/7')), default='70/8')
    timezone = models.CharField(max_length=50, default='UTC')

    def __str__(self):
        return self.name

class Trip(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    start_location = models.CharField(max_length=250)
    pickup_location = models.CharField(max_length=250)
    dropoff_location = models.CharField(max_length=250)
    distance_miles = models.FloatField(null=True, blank=True)
    route_geojson = models.JSONField(null=True, blank=True)
    estimated_minutes = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Trip {self.id} by {self.driver}"

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
