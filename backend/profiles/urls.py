from django.urls import path
from rest_framework.routers import DefaultRouter

from profiles.views.profile_view import ProfileAPIView
from profiles.views.preference_view import PreferenceViewSet

router = DefaultRouter()
router.register(r"preferences/", PreferenceViewSet)
urlpatterns = [
    path("", ProfileAPIView.as_view(), name="profile"),
]