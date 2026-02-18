import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def send_websocket_notification(user_id, data):
    """Deliver a real-time notification update to a specific user group."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning(
            "WebSocket notification skipped because channel layer is unavailable "
            "for user_id=%s",
            user_id,
        )
        return False

    group_name = f"user_{user_id}"
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {"type": "notification_update", "data": data},
        )
    except Exception:
        logger.exception(
            "Failed to send WebSocket notification for user_id=%s",
            user_id,
        )
        return False

    return True


def notify_user(user_id, data):
    """Queue a lightweight Celery task for real-time WebSocket delivery."""
    try:
        from notifications.tasks import send_websocket_notification_task

        send_websocket_notification_task.delay(user_id, data)
    except Exception:
        logger.exception(
            "Failed to enqueue WebSocket notification task for user_id=%s",
            user_id,
        )
