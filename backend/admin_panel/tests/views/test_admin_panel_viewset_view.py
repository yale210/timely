"""Tests for admin panel viewset configuration."""

from django.test import SimpleTestCase
from rest_framework import permissions

from admin_panel.serializers import AdminUserListSerializer
from admin_panel.views import AdminPanelViewSet as ExportedAdminPanelViewSet
from admin_panel.views.admin_panel_viewset_view import (
    AdminPanelViewSet,
    AdminUserPagination,
)
from admin_panel.views.notification_actions_view import AdminNotificationActionMixin
from admin_panel.views.users_actions_view import AdminUsersActionMixin


class AdminUserPaginationTests(SimpleTestCase):
    """Test pagination defaults used by the admin panel viewset."""

    def test_pagination_defaults_match_admin_contract(self):
        """Verify the admin pagination defaults remain stable."""
        self.assertEqual(AdminUserPagination.page_size, 50)
        self.assertEqual(AdminUserPagination.page_size_query_param, "page_size")
        self.assertEqual(AdminUserPagination.max_page_size, 200)


class AdminPanelViewSetConfigurationTests(SimpleTestCase):
    """Test AdminPanelViewSet class wiring."""

    def test_viewset_uses_expected_mixins_and_defaults(self):
        """Verify the viewset is configured with the expected mixins and classes."""
        self.assertTrue(issubclass(AdminPanelViewSet, AdminNotificationActionMixin))
        self.assertTrue(issubclass(AdminPanelViewSet, AdminUsersActionMixin))
        self.assertEqual(
            AdminPanelViewSet.permission_classes, [permissions.IsAdminUser]
        )
        self.assertIs(AdminPanelViewSet.serializer_class, AdminUserListSerializer)
        self.assertIs(AdminPanelViewSet.pagination_class, AdminUserPagination)

    def test_viewset_exports_expected_extra_actions(self):
        """Verify the composed viewset exposes all admin panel actions."""
        action_names = {
            action.__name__ for action in AdminPanelViewSet.get_extra_actions()
        }

        self.assertSetEqual(
            action_names,
            {
                "users",
                "send_notification",
                "audience_counts",
                "broadcasts",
                "broadcast_detail",
                "broadcast_recipients",
                "broadcast_status",
                "retry_failed",
            },
        )

    def test_viewset_build_target_queryset_returns_none_for_unknown_target(self):
        """Verify unknown audience targets resolve to an empty queryset."""
        view = AdminPanelViewSet()

        queryset = view._build_target_queryset("invalid", [])

        self.assertEqual(queryset.count(), 0)

    def test_views_package_exports_admin_panel_viewset(self):
        """Verify the views package re-exports the viewset class."""
        self.assertIs(ExportedAdminPanelViewSet, AdminPanelViewSet)
