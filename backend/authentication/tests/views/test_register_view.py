"""Tests for the registration API view."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ...models import User
from profiles.models import Profile


class RegisterViewTest(APITestCase):
    """Test registration view validation."""

    def setUp(self):
        """Create the register endpoint URL used by the tests."""
        self.url = reverse("register")

    def test_successful_registration(self):
        """Verify successful registration of user with valid data."""
        data = {
            "username": "newapitestuser",
            "email": "newapitest@example.com",
            "password": "password123",
            "name": "New API Test User",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "newapitestuser")
        self.assertEqual(response.data["user"]["email"], "newapitest@example.com")
        self.assertTrue(User.objects.filter(username="newapitestuser").exists())
        self.assertEqual(
            Profile.objects.get(user__username="newapitestuser").name,
            "New API Test User",
        )

    def test_registration_with_invalid_data(self):
        """Verify unsuccessful registration of user with invalid data."""
        data = {"username": "invaliduser"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("name", response.data)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="invaliduser").exists())
