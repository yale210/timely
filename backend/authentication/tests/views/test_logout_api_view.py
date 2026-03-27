"""Tests for the logout API view."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from knox.models import AuthToken
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class LogoutAPIViewTest(APITestCase):
    """Test logout behavior for the current authenticated session."""

    def setUp(self):
        """Create a user, token, and logout URL for the tests."""
        self.user = User.objects.create_user(
            username="logout-user",
            email="logout@example.com",
            password="password123",
        )
        self.url = reverse("logout")
        self.token_instance, self.token = AuthToken.objects.create(self.user)

    def test_logout_requires_authentication(self):
        """Verify unauthenticated logout requests are rejected."""
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_deletes_the_current_token(self):
        """Verify logout invalidates the token used for the request."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AuthToken.objects.filter(pk=self.token_instance.pk).exists())
