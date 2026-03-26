"""Tests for the registration API view."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ...models import User


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
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("username", response.data)
        self.assertIn("email", response.data)
        self.assertNotIn("password", response.data)
        self.assertTrue(User.objects.filter(username="newapitestuser").exists())

    def test_registration_with_invalid_data(self):
        """Verify unsuccessful registration of user with invalid data."""
        data = {
            "username": "invaliduser"
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="invaliduser").exists())
