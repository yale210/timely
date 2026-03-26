from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class UsernameViewTest(APITestCase):
    """Tests for the username lookup API view."""

    def setUp(self):
        """Create a user and the endpoint URL used by the tests."""
        self.user = get_user_model().objects.create_user(
            username="lookup-user",
            email="lookup@example.com",
            password="password123",
        )
        self.url = reverse("username-view", kwargs={"user_id": self.user.id})

    def test_get_returns_user_id_and_username(self):
        """Verify that looking up an existing user returns the expected payload."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "id": self.user.id,
                "username": self.user.username,
            },
        )

    def test_get_returns_not_found_for_missing_user(self):
        """Verify that looking up a missing user returns a 404 response."""
        response = self.client.get(
            reverse("username-view", kwargs={"user_id": self.user.id + 1})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"detail": "User not found."})
