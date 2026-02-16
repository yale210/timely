from django.db.models.signals import post_save
from django.dispatch import receiver

from core.models.notification import Notification
from core.utils.websocket import notify_user


@receiver(post_save, sender=Notification)
def push_notification_on_create(sender, instance, created, **kwargs):
    """
    When a Notification is created, push the full notification data
    and updated unread count to the recipient via WebSocket.
    """
    if not created:
        return

    unread_count = Notification.objects.filter(
        recipient=instance.recipient, is_read=False
    ).count()

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
