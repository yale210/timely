"""URL configuration and routing for the pomo application."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pomo.views import PomoSessionViewSet

router = DefaultRouter()
router.register(r"sessions", PomoSessionViewSet, basename="pomo-session")

urlpatterns = [
    path("", include(router.urls)),
]
