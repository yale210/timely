from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from admin_panel.serializers import AdminNotificationRequestSerializer
from notifications.tasks import broadcast_notification


class AdminNotificationActionMixin:
    @action(detail=False, methods=["post"])
    def send_notification(self, request):
        serializer = AdminNotificationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        title = validated_data["title"]
        message = validated_data["message"]
        target = validated_data.get("target", "all")
        user_ids = validated_data.get("user_ids")

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
