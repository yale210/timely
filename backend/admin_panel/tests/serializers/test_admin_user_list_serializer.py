"""Tests for the admin user list serializer."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_panel.serializers import AdminUserListSerializer

User = get_user_model()


class AdminUserListSerializerTests(TestCase):
    """Test serialization of admin-facing user list data."""

    def test_serializes_expected_user_fields(self):
        """Verify the serializer exposes the expected user fields."""
        user = User.objects.create_user(
            username="moderator",
            email="moderator@example.com",
            password="password123",
        )
        user.is_staff = True
        user.save(update_fields=["is_staff"])

        serializer = AdminUserListSerializer(user)

        self.assertEqual(
            set(serializer.data.keys()),
            {
                "id",
                "username",
                "email",
                "is_staff",
                "is_superuser",
                "is_active",
                "date_joined",
                "last_login",
            },
        )
        self.assertEqual(serializer.data["id"], user.id)
        self.assertEqual(serializer.data["username"], "moderator")
        self.assertEqual(serializer.data["email"], "moderator@example.com")
        self.assertTrue(serializer.data["is_staff"])
        self.assertFalse(serializer.data["is_superuser"])
        self.assertTrue(serializer.data["is_active"])
