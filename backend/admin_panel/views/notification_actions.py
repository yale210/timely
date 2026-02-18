from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from notifications.tasks import broadcast_notification


class AdminNotificationActionMixin:
    @action(detail=False, methods=["post"])
    def send_notification(self, request):
        title = request.data.get("title")
        message = request.data.get("message")
        target = request.data.get("target", "all")
        user_ids = request.data.get("user_ids")

        if not title or not message:
            return Response(
                {"error": "Title and message are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = broadcast_notification.delay(
            title=title,
            message=message,
            target=target,
            user_ids=user_ids,
        )

        return Response(
            {"status": "Notification broadcast initiated", "task_id": task.id},
            status=status.HTTP_202_ACCEPTED,
        )
