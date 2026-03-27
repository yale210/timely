"""Tests for the logout-all API view."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from knox.models import AuthToken
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class LogoutAllAPIViewTest(APITestCase):
    """Test logout-all behavior for authenticated users."""

    def setUp(self):
        """Create users, tokens, and the logout-all URL for the tests."""
        self.user = User.objects.create_user(
            username="logoutall-user",
            email="logoutall@example.com",
            password="password123",
        )
        self.other_user = User.objects.create_user(
            username="other-user",
            email="other@example.com",
            password="password123",
        )
        self.url = reverse("logoutall")
        _, self.token = AuthToken.objects.create(self.user)
        AuthToken.objects.create(self.user)
        self.other_token_instance, _ = AuthToken.objects.create(self.other_user)

    def test_logout_all_requires_authentication(self):
        """Verify unauthenticated logout-all requests are rejected."""
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_all_deletes_only_the_current_users_tokens(self):
        """Verify logout-all removes every token for the current user only."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AuthToken.objects.filter(user=self.user).count(), 0)
        self.assertTrue(
            AuthToken.objects.filter(pk=self.other_token_instance.pk).exists()
        )
