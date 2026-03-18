from django.urls import path

from profiles.views.profile_view import ProfileAPIView, PublicProfileAPIView
from profiles.views.leaderboard_view import LeaderboardAPIView


urlpatterns = [
    path("leaderboard/", LeaderboardAPIView.as_view(), name="leaderboard"),
    path("<str:username>/", PublicProfileAPIView.as_view(), name="public-profile"),
    path("", ProfileAPIView.as_view(), name="profile"),
 
]
