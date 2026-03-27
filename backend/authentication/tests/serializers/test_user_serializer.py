"""Tests for the user serializer."""

from datetime import date

from django.test import TestCase

from ...models import User
from ...serializers import UserSerializer


class UserSerializerTest(TestCase):
    """Test serialization of user data exposed by the auth API."""

    def setUp(self):
        """Create a user fixture for serializer output tests."""
        self.user = User.objects.create_user(
            username="serializeduser",
            email="serialized@example.com",
            password="password123",
            date_of_birth=date(2000, 1, 1),
        )
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])

    def test_serializer_returns_expected_user_fields(self):
        """Verify serialized output includes the expected public user fields."""
        serializer = UserSerializer(self.user)

        self.assertEqual(serializer.data["id"], self.user.id)
        self.assertEqual(serializer.data["username"], "serializeduser")
        self.assertEqual(serializer.data["email"], "serialized@example.com")
        self.assertEqual(serializer.data["date_of_birth"], "2000-01-01")
        self.assertEqual(serializer.data["is_staff"], True)
        self.assertEqual(serializer.data["is_superuser"], False)
        self.assertIn("last_login", serializer.data)
        self.assertIn("date_joined", serializer.data)
