from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import Notification
from notifications.tasks import send_push_notification
from notifications.utils.unread_count import (
    increment_unread_count,
    refresh_unread_count,
)
from notifications.utils.websocket import notify_user


@receiver(post_save, sender=Notification)
def push_notification_on_create(sender, instance, created, **kwargs):
    if not created:
        return

    if instance.is_read:
        unread_count = refresh_unread_count(instance.recipient_id)
    else:
        unread_count = increment_unread_count(instance.recipient_id, amount=1)

    notify_user(
        instance.recipient_id,
        {
            "type": "new_notification",
            "notification": {
                "id": instance.id,
                "recipient": instance.recipient_id,
                "sender": instance.sender_id,
                "sender_username": (
                    instance.sender.username if instance.sender else None
                ),
                "title": instance.title,
                "message": instance.message,
                "is_read": instance.is_read,
                "timestamp": instance.timestamp.isoformat(),
                "notification_type": instance.notification_type,
            },
            "unread_count": unread_count,
        },
    )

    if not getattr(instance, "_skip_push", False):
        send_push_notification.delay(
            instance.recipient_id,
            instance.title,
            instance.message,
        )
