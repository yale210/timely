from django.urls import path

from profiles.views.profile_view import ProfileAPIView

urlpatterns = [
    path("", ProfileAPIView.as_view(), name="profile"),
]
