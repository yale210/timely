"""Tests for leaderboard API behavior."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Friendship
from profiles.models.profile import Profile

User = get_user_model()


class LeaderboardAPIViewTests(APITestCase):
    """Test leaderboard responses for authenticated and anonymous users."""

    def setUp(self):
        """Create a user, a friend, a non-friend, and the leaderboard URL."""
        self.user = User.objects.create_user(
            username="me", password="password", email="me@example.com"
        )
        self.profile, _ = Profile.objects.update_or_create(
            user=self.user, defaults={"name": "Me", "level": 10}
        )

        self.friend = User.objects.create_user(
            username="friend", password="password", email="friend@example.com"
        )
        self.friend_profile, _ = Profile.objects.update_or_create(
            user=self.friend, defaults={"name": "Friend", "level": 20}
        )

        self.not_friend = User.objects.create_user(
            username="not_friend", password="password", email="not_friend@example.com"
        )
        self.not_friend_profile, _ = Profile.objects.update_or_create(
            user=self.not_friend, defaults={"name": "Not Friend", "level": 30}
        )

        self.url = reverse("leaderboard")

    def test_leaderboard_authenticated_no_friends(self):
        """Verify the leaderboard only includes the requester without friends."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only contain me
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Me")

    def test_leaderboard_authenticated_with_friends(self):
        """Verify accepted friends appear and results are level-ordered."""
        Friendship.objects.create(
            sender=self.user, receiver=self.friend, state=Friendship.State.ACCEPTED
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain me and friend (ordered by level descending)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["name"], "Friend")  # Friend has level 20
        self.assertEqual(response.data[1]["name"], "Me")  # Me has level 10

    def test_leaderboard_reverse_friendship(self):
        """Verify accepted friendships work regardless of sender direction."""
        Friendship.objects.create(
            sender=self.friend, receiver=self.user, state=Friendship.State.ACCEPTED
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_leaderboard_unauthenticated(self):
        """Verify anonymous requests are rejected."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
