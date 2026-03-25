"""URL routing for the notifications app API."""

from django.urls import include, path
from rest_framework.routers import SimpleRouter

from notifications.views import NotificationViewSet, PushSubscriptionViewSet

router = SimpleRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"push", PushSubscriptionViewSet, basename="push")

urlpatterns = [
    path("", include(router.urls)),
]
