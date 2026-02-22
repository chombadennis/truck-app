# api/urls.py
from django.urls import path
from .views import PlanTripView, RegionalRuleListView, health_check

urlpatterns = [
    path("healthz/", health_check, name="health-check"),
    path("plan-trip/", PlanTripView.as_view(), name="plan-trip"),
    path("rules/", RegionalRuleListView.as_view(), name="rules-list"),
]
