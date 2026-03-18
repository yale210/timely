from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ...models import User


class RegisterViewTest(APITestCase):
    """Tests for registration view validation."""

    def test_successful_registration(self):
        """Verify successful registration of user with valid data."""
        url = reverse("register")
        data = {
            "username": "newapitestuser",
            "email": "newapitest@example.com",
            "password": "password123",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("username", response.data)
        self.assertIn("email", response.data)
        self.assertNotIn("password", response.data)  # Password should not be returned
        self.assertTrue(User.objects.filter(username="newapitestuser").exists())

    def test_registration_with_invalid_data(self):
        """Verify unsuccessful registration of user with invalid data."""
        url = reverse("register")
        data = {
            "username": "invaliduser"
            # Missing email and password
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="invaliduser").exists())
