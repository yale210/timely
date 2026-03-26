"""Tests for admin-panel user filter helpers."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_panel.services.user_filters import apply_role_filter

User = get_user_model()


class ApplyRoleFilterTests(TestCase):
    """Test role-based user filtering for the admin panel."""

    def setUp(self):
        """Create admin, staff, and regular users for filter tests."""
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@example.com",
        )
        self.staff_user = User.objects.create_user(
            username="staff",
            password="password",
            email="staff@example.com",
        )
        self.staff_user.is_staff = True
        self.staff_user.save(update_fields=["is_staff"])
        self.regular_user = User.objects.create_user(
            username="regular",
            password="password",
            email="regular@example.com",
        )

    def test_apply_role_filter_returns_staff_and_admin_users_for_staff_role(self):
        """Verify the staff filter retains both staff members and superusers."""
        queryset = User.objects.order_by("username")

        filtered = apply_role_filter(queryset, "staff")

        self.assertEqual(
            list(filtered.values_list("username", flat=True)),
            ["admin", "staff"],
        )

    def test_apply_role_filter_returns_only_regular_users_for_users_role(self):
        """Verify the regular-user filter excludes staff and admin accounts."""
        queryset = User.objects.order_by("username")

        filtered = apply_role_filter(queryset, "users")

        self.assertEqual(
            list(filtered.values_list("username", flat=True)),
            ["regular"],
        )

    def test_apply_role_filter_leaves_queryset_unchanged_for_unknown_role(self):
        """Verify unknown role filters leave the queryset unchanged."""
        queryset = User.objects.order_by("username")

        filtered = apply_role_filter(queryset, "unknown")

        self.assertEqual(filtered.count(), 3)
