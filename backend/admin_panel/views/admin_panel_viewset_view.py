"""Viewsets for admin panel endpoints."""

from rest_framework import pagination, permissions, viewsets

from admin_panel.serializers import AdminUserListSerializer
from admin_panel.views.notification_actions import AdminNotificationActionMixin
from admin_panel.views.users_actions import AdminUsersActionMixin


class AdminUserPagination(pagination.PageNumberPagination):
    """Pagination settings for admin panel list endpoints."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AdminPanelViewSet(
    AdminNotificationActionMixin,
    AdminUsersActionMixin,
    viewsets.GenericViewSet,
):
    """Expose admin panel actions for users and notifications."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer
    pagination_class = AdminUserPagination
