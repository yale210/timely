"""Tests for the custom authentication backend."""

from django.test import TestCase
from django.contrib.auth import get_user_model

from ..authenticator import Authenticator

User = get_user_model()


class AuthenticatorTests(TestCase):
    """Test username/password authentication against the custom user model."""

    def setUp(self):
        """Create a user and backend instance for authentication tests."""
        self.username = "testuser"
        self.password = "password123"
        self.user = User.objects.create_user(
            username=self.username, password=self.password, email="test@example.com"
        )
        self.backend = Authenticator()

    def test_authenticate_valid(self):
        """Verify valid credentials return the authenticated user."""
        user = self.backend.authenticate(
            None, username=self.username, password=self.password
        )
        self.assertEqual(user, self.user)

    def test_authenticate_invalid_username(self):
        """Verify unknown usernames return no authenticated user."""
        user = self.backend.authenticate(
            None, username="wronguser", password=self.password
        )
        self.assertIsNone(user)

    def test_authenticate_invalid_password(self):
        """Verify incorrect passwords return no authenticated user."""
        user = self.backend.authenticate(
            None, username=self.username, password="wrongpassword"
        )
        self.assertIsNone(user)
