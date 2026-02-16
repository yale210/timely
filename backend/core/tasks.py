from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from core.models.event_reminder import EventReminder
from core.models.notification import Notification
from core.models.push_subscription import PushSubscription
from pywebpush import webpush, WebPushException
from django.conf import settings
import json

User = get_user_model()


@shared_task
def check_reminders():
    now = timezone.now()
    due_reminders = EventReminder.objects.filter(trigger_at__lte=now, processed=False)

    for reminder in due_reminders:
        event = reminder.event
        user = event.user

        # Create in-app notification
        Notification.objects.create(
            recipient=user,
            title=f"Reminder: {event.title}",
            message=f"Your event '{event.title}' is starting soon.",
            notification_type=Notification.NotificationType.REMINDER,
        )

        # Send push notification if enabled
        if reminder.send_push:
            send_push_notification.delay(
                user.id,
                f"Reminder: {event.title}",
                f"Your event '{event.title}' is starting soon.",
            )

        # Mark as processed
        reminder.processed = True
        reminder.save()


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
            # If subscription is expired/invalid, we could delete it
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

        # Optionally send push as well
        send_push_notification.delay(user.id, title, message)

    return f"Broadcasted to {recipients.count()} users"
