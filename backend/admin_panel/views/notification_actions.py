"""Notification management actions for the admin panel."""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from admin_panel.serializers import (
    AdminNotificationRequestSerializer,
    BroadcastJobDetailSerializer,
    BroadcastJobListSerializer,
)
from admin_panel.services import (
    build_queued_job_payload,
    create_broadcast_job,
    create_retry_broadcast_job,
    get_failed_recipient_ids,
    queue_broadcast_job,
)
from notifications.models import BroadcastJob
from notifications.tasks import process_broadcast_job


class AdminNotificationActionMixin:
    """Provide broadcast notification actions for admins."""

    def _build_target_queryset(self, target, user_ids):
        """Build the recipient queryset for a broadcast target.

        Args:
            target: Selected broadcast target.
            user_ids: Explicit user IDs for targeted sends.

        Returns:
            QuerySet: Recipient queryset for the requested audience.
        """
        user_model = get_user_model()
        queryset = user_model.objects.filter(is_active=True)
        if target == BroadcastJob.Target.ALL:
            return queryset
        if target == BroadcastJob.Target.STAFF:
            return queryset.filter(is_staff=True)
        if target == BroadcastJob.Target.ADMIN:
            return queryset.filter(is_superuser=True)
        if target == BroadcastJob.Target.USERS:
            return queryset.filter(id__in=user_ids)
        return queryset.none()

    def _serialize_error(self, code, message, errors=None):
        """Build a consistent error payload for admin endpoints.

        Args:
            code: Machine-readable error code.
            message: Human-readable error message.
            errors: Optional nested validation details.

        Returns:
            dict: Serialized error payload.
        """
        payload = {"error": {"code": code, "message": message}}
        if errors:
            payload["error"]["errors"] = errors
        return payload

    def _bad_request_response(self, code, message, errors=None):
        """Return a standard bad-request response payload."""
        return Response(
            self._serialize_error(code, message, errors),
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _queued_job_response(self, broadcast_job):
        """Return the accepted response for a queued broadcast job."""
        task = queue_broadcast_job(broadcast_job, process_broadcast_job)
        payload = build_queued_job_payload(broadcast_job, task.id)
        return Response(payload, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=["post"])
    def send_notification(self, request):
        """Queue a broadcast notification for the selected audience.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Accepted broadcast metadata or a validation error.
        """
        serializer = AdminNotificationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return self._bad_request_response(
                "VALIDATION_FAILED", "Invalid notification payload.", serializer.errors
            )
        validated_data = serializer.validated_data
        target = validated_data.get("target", BroadcastJob.Target.ALL)
        user_ids = validated_data.get("user_ids", [])
        recipient_ids = list(
            self._build_target_queryset(target, user_ids).values_list("id", flat=True)
        )
        if not recipient_ids:
            return self._bad_request_response(
                "ZERO_AUDIENCE", "The selected audience has no active recipients."
            )
        broadcast_job = create_broadcast_job(
            sender=request.user,
            title=validated_data["title"],
            message=validated_data["message"],
            target=target,
            user_ids=user_ids,
            recipient_ids=recipient_ids,
        )
        return self._queued_job_response(broadcast_job)

    @action(detail=False, methods=["get"])
    def audience_counts(self, request):
        """Return audience counts for admin notification targeting.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Counts for each supported audience type.
        """
        user_model = get_user_model()
        active_users = user_model.objects.filter(is_active=True)
        raw_user_ids = request.query_params.get("user_ids", "")
        selected_user_ids = [
            int(value) for value in raw_user_ids.split(",") if value.strip().isdigit()
        ]

        selected_count = 0
        if selected_user_ids:
            selected_count = active_users.filter(id__in=selected_user_ids).count()

        return Response(
            {
                "all": active_users.count(),
                "staff": active_users.filter(is_staff=True).count(),
                "admin": active_users.filter(is_superuser=True).count(),
                "selected_users": selected_count,
            }
        )

    @action(detail=False, methods=["get"], url_path="broadcasts")
    def broadcasts(self, request):
        """List broadcast jobs with optional admin filters.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Paginated or full broadcast job list.
        """
        queryset = BroadcastJob.objects.select_related("sender")
        target = request.query_params.get("target")
        status_filter = request.query_params.get("status")
        query = request.query_params.get("q")

        if target in BroadcastJob.Target.values:
            queryset = queryset.filter(target=target)
        if status_filter in BroadcastJob.Status.values:
            queryset = queryset.filter(status=status_filter)
        if query:
            queryset = queryset.filter(title__icontains=query)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BroadcastJobListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = BroadcastJobListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=False, methods=["get"], url_path=r"broadcasts/(?P<broadcast_id>[^/.]+)"
    )
    def broadcast_detail(self, request, broadcast_id=None):
        """Return detailed data for a single broadcast job.

        Args:
            request: The incoming DRF request.
            broadcast_id: Broadcast job primary key from the URL.

        Returns:
            Response: Broadcast detail payload or a not-found error.
        """
        broadcast = (
            BroadcastJob.objects.select_related("sender")
            .filter(id=broadcast_id)
            .first()
        )
        if not broadcast:
            return Response(
                self._serialize_error(
                    code="NOT_FOUND",
                    message="Broadcast not found.",
                ),
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BroadcastJobDetailSerializer(broadcast)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path=r"broadcasts/(?P<broadcast_id>[^/.]+)/status",
    )
    def broadcast_status(self, request, broadcast_id=None):
        """Return summary status information for a broadcast job.

        Args:
            request: The incoming DRF request.
            broadcast_id: Broadcast job primary key from the URL.

        Returns:
            Response: Broadcast status payload or a not-found error.
        """
        broadcast = BroadcastJob.objects.filter(id=broadcast_id).first()
        if not broadcast:
            return Response(
                self._serialize_error(
                    code="NOT_FOUND",
                    message="Broadcast not found.",
                ),
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "id": broadcast.id,
                "status": broadcast.status,
                "recipient_count": broadcast.recipient_count,
                "delivered_count": broadcast.delivered_count,
                "failed_count": broadcast.failed_count,
                "queued_at": broadcast.queued_at.isoformat(),
                "started_at": (
                    broadcast.started_at.isoformat() if broadcast.started_at else None
                ),
                "completed_at": (
                    broadcast.completed_at.isoformat()
                    if broadcast.completed_at
                    else None
                ),
                "task_id": broadcast.task_id,
                "updated_at": timezone.localtime(broadcast.updated_at).isoformat(),
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path=r"broadcasts/(?P<broadcast_id>[^/.]+)/retry_failed",
    )
    def retry_failed(self, request, broadcast_id=None):
        """Create a retry broadcast for failed recipients only.

        Args:
            request: The incoming DRF request.
            broadcast_id: Broadcast job primary key from the URL.

        Returns:
            Response: Accepted retry job metadata or an error payload.
        """
        broadcast = BroadcastJob.objects.filter(id=broadcast_id).first()
        if not broadcast:
            return Response(
                self._serialize_error(
                    code="NOT_FOUND",
                    message="Broadcast not found.",
                ),
                status=status.HTTP_404_NOT_FOUND,
            )
        failed_recipient_ids = get_failed_recipient_ids(broadcast)
        if not failed_recipient_ids:
            return self._bad_request_response(
                "ZERO_AUDIENCE", "No failed recipients available for retry."
            )
        retry_job = create_retry_broadcast_job(
            sender=request.user,
            broadcast=broadcast,
            failed_recipient_ids=failed_recipient_ids,
        )
        return self._queued_job_response(retry_job)
