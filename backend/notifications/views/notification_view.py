"""API views for managing user notifications."""

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
    """Pagination configuration for notification lists."""

    page_size = 10


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and managing user notifications."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination
    queryset = Notification.objects.all()

    def get_queryset(self):
        """Retrieve the notifications for the current authenticated user.

        Supports filtering by 'is_read' and 'notification_type'.

        Returns:
            A filtered queryset of Notification objects.
        """
        queryset = Notification.objects.filter(recipient=self.request.user)

        # Apply is_read filtering if provided in query params
        is_read = self.request.query_params.get("is_read")
        if is_read in {"true", "false"}:
            queryset = queryset.filter(is_read=(is_read == "true"))

        # Apply notification_type filtering if provided
        notification_type = self.request.query_params.get("notification_type")
        if notification_type in Notification.NotificationType.values:
            queryset = queryset.filter(notification_type=notification_type)

        return queryset

    def perform_create(self, serializer):
        """Ensure the current user is set as the recipient for new notifications.

        Args:
            serializer: The serializer instance containing validated data.
        """
        serializer.save(recipient=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read.

        Args:
            request: The current request.
            pk: Primary key of the notification.

        Returns:
            A Response indicating completion.
        """
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
            # Decrement the cached unread count
            increment_unread_count(request.user.id, amount=-1)
        return Response({"status": "notification marked as read"})

    @action(detail=True, methods=["post"])
    def mark_unread(self, request, pk=None):
        """Mark a specific notification as unread.

        Args:
            request: The current request.
            pk: Primary key of the notification.

        Returns:
            A Response indicating completion.
        """
        notification = self.get_object()
        if notification.is_read:
            notification.is_read = False
            notification.save(update_fields=["is_read"])
            # Increment the cached unread count
            increment_unread_count(request.user.id, amount=1)
        return Response({"status": "notification marked as unread"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all notifications for the current user as read.

        Uses an unfiltered queryset to ensure every notification is
        included regardless of query-param filters on the viewset.

        Args:
            request: The current request.

        Returns:
            A Response indicating completion.
        """
        # Use unfiltered queryset so query-param filters do not cause a
        # partial update while the cache is unconditionally zeroed.
        Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True
        )
        # Reset the cached count to zero
        set_unread_count(request.user.id, 0)
        return Response({"status": "all notifications marked as read"})

    @action(detail=False, methods=["delete"])
    def delete_all(self, request):
        """Delete all notifications for the current user.

        Uses an unfiltered queryset to ensure every notification is
        removed regardless of query-param filters on the viewset.

        Args:
            request: The current request.

        Returns:
            A 204 No Content response.
        """
        # Use unfiltered queryset so query-param filters do not leave
        # notifications behind while the cache is unconditionally zeroed.
        Notification.objects.filter(recipient=request.user).delete()
        # Reset the cached count to zero after deletion
        set_unread_count(request.user.id, 0)
        return Response(
            {"status": "all notifications deleted"},
            status=status.HTTP_204_NO_CONTENT,
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Retrieve the current unread notification count.

        Args:
            request: The current request.

        Returns:
            A JSON response containing the count.
        """
        count = refresh_unread_count(request.user.id)
        return Response({"count": count})
