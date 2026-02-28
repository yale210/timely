from rest_framework import pagination, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from notifications.utils.unread_count import (
    increment_unread_count,
    refresh_unread_count,
    set_unread_count,
)


class NotificationPagination(pagination.PageNumberPagination):
    page_size = 10


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)

        is_read = self.request.query_params.get("is_read")
        if is_read in {"true", "false"}:
            queryset = queryset.filter(is_read=(is_read == "true"))

        notification_type = self.request.query_params.get("notification_type")
        if notification_type in Notification.NotificationType.values:
            queryset = queryset.filter(notification_type=notification_type)

        return queryset

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
            increment_unread_count(request.user.id, amount=-1)
        return Response({"status": "notification marked as read"})

    @action(detail=True, methods=["post"])
    def mark_unread(self, request, pk=None):
        notification = self.get_object()
        if notification.is_read:
            notification.is_read = False
            notification.save(update_fields=["is_read"])
            increment_unread_count(request.user.id, amount=1)
        return Response({"status": "notification marked as unread"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        set_unread_count(request.user.id, 0)
        return Response({"status": "all notifications marked as read"})

    @action(detail=False, methods=["delete"])
    def delete_all(self, request):
        self.get_queryset().delete()
        set_unread_count(request.user.id, 0)
        return Response(
            {"status": "all notifications deleted"},
            status=status.HTTP_204_NO_CONTENT,
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = refresh_unread_count(request.user.id)
        return Response({"count": count})
