"""Tests for the permission test API view."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from knox.models import AuthToken
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class PermissionTestViewTests(APITestCase):
    """Test the authenticated permission-check endpoint."""

    def setUp(self):
        """Create a user, token, and permission-test URL for the tests."""
        self.user = User.objects.create_user(
            username="permission-user",
            email="permission@example.com",
            password="password123",
        )
        self.url = reverse("test")
        _, self.token = AuthToken.objects.create(self.user)

    def test_permission_test_requires_authentication(self):
        """Verify unauthenticated requests are rejected."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission_test_returns_authenticated_message(self):
        """Verify authenticated requests receive the expected success payload."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"message": f"You are authenticated!: {self.user}"},
        )
