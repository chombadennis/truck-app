# api/urls.py
from django.urls import path
from .views import PlanTripView, RegionalRuleListView

urlpatterns = [
    path("plan-trip/", PlanTripView.as_view(), name="plan-trip"),
    path("rules/", RegionalRuleListView.as_view(), name="rules-list"),
]
