from django.urls import path

from profiles.views.profile_view import ProfileAPIView, PublicProfileAPIView

urlpatterns = [
    path("<str:username>/", PublicProfileAPIView.as_view(), name="public-profile"),
    path("", ProfileAPIView.as_view(), name="profile"),
]
