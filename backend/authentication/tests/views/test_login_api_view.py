"""Tests for the login API view."""

from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ErrorDetail
from rest_framework.test import APITestCase
from ...models import User


class LoginAPIViewTest(APITestCase):
    """Tests for login API validation."""
    
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )
    
    def setUp(self):
        """Create a user for login API authentication tests."""
        self.login_url = reverse("login")

    def test_successful_login(self):
        """Verify successful login of user."""
        data = {"username": "testuser", "password": "password123"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["id"], self.user.id)

    def test_login_with_invalid_credentials(self):
        """Verify unsuccessful login of user with invalid credentials."""
        data = {"username": "testuser", "password": "wrongpassword"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertIn("Invalid credentials.", response.data["non_field_errors"])

    def test_login_with_missing_fields(self):
        """Verify unsuccessful login of user with missing fields."""
        data = {"username": "testuser"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertEqual(
            response.data["password"][0],
            ErrorDetail("This field is required.", code="required"),
        )
