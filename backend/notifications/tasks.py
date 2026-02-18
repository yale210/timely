import json

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from pywebpush import WebPushException, webpush

from core.models.event_reminder import EventReminder
from notifications.models import Notification, PushSubscription
from notifications.utils.websocket import send_websocket_notification

User = get_user_model()


@shared_task
def check_reminders():
    now = timezone.now()
    due_reminders = EventReminder.objects.filter(trigger_at__lte=now, processed=False)

    for reminder in due_reminders:
        event = reminder.event
        user = event.user

        notification = Notification(
            recipient=user,
            title=f"Reminder: {event.title}",
            message=f"Your event '{event.title}' is starting soon.",
            notification_type=Notification.NotificationType.REMINDER,
        )
        if not reminder.send_push:
            notification._skip_push = True
        notification.save()

        reminder.processed = True
        reminder.save(update_fields=["processed"])


@shared_task(ignore_result=True)
def send_websocket_notification_task(user_id, data):
    send_websocket_notification(user_id, data)


@shared_task
def send_push_notification(user_id, title, message):
    subscriptions = PushSubscription.objects.filter(user_id=user_id)
    payload = json.dumps({"title": title, "message": message})

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"},
            )
        except WebPushException as ex:
            if ex.response and ex.response.status_code in [404, 410]:
                sub.delete()


@shared_task
def cleanup_old_notifications():
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    Notification.objects.filter(timestamp__lt=thirty_days_ago).delete()


@shared_task
def broadcast_notification(title, message, target="all", user_ids=None):
    if target == "all":
        recipients = User.objects.all()
    elif target == "staff":
        recipients = User.objects.filter(is_staff=True)
    elif target == "users" and user_ids:
        recipients = User.objects.filter(id__in=user_ids)
    else:
        return "Invalid target"

    for user in recipients:
        Notification.objects.create(
            recipient=user,
            title=title,
            message=message,
            notification_type=Notification.NotificationType.ADMIN,
        )

    return f"Broadcasted to {recipients.count()} users"
