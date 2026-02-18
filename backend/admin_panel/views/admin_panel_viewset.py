from rest_framework import permissions, viewsets

from admin_panel.serializers import AdminUserListSerializer
from admin_panel.views.notification_actions import AdminNotificationActionMixin
from admin_panel.views.users_actions import AdminUsersActionMixin


class AdminPanelViewSet(
    AdminNotificationActionMixin,
    AdminUsersActionMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer
