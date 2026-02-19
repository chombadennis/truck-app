# api/urls.py
from django.urls import path
from .views import PlanTripView

urlpatterns = [
    path("plan-trip/", PlanTripView.as_view(), name="plan-trip"),
]
