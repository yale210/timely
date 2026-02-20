import json
from datetime import timedelta
import hashlib
import logging

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from pywebpush import WebPushException, webpush

from core.models import Event, ReminderDispatchLog
from core.models.event_reminder import EventReminder
from core.services import expand_event_instances
from notifications.models import Notification, PushSubscription
from notifications.utils.unread_count import increment_unread_count
from notifications.utils.websocket import notify_user, send_websocket_notification

User = get_user_model()
logger = logging.getLogger(__name__)


def _send_reminder_notification(
    *,
    user_id,
    title: str,
    event_title: str,
    send_push: bool,
):
    notification = Notification(
        recipient_id=user_id,
        title=title,
        message=f"Your event '{event_title}' is starting soon.",
        notification_type=Notification.NotificationType.REMINDER,
    )
    if not send_push:
        notification._skip_push = True
    notification.save()


def _reminder_signature(reminder: dict) -> str:
    payload = json.dumps(
        {
            "minutes_before": int(reminder["minutes_before"]),
            "send_email": bool(reminder.get("send_email", False)),
            "send_push": bool(reminder.get("send_push", False)),
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _record_dispatch(source_event: Event, original_start_time, reminder: dict) -> bool:
    try:
        with transaction.atomic():
            ReminderDispatchLog.objects.create(
                source_event=source_event,
                original_start_time=original_start_time,
                reminder_signature=_reminder_signature(reminder),
            )
    except IntegrityError:
        return False
    return True


@shared_task
def check_reminders():
    now = timezone.now()
    due_window_start = now - timedelta(minutes=1)

    due_reminders = EventReminder.objects.filter(
        trigger_at__lte=now,
        processed=False,
    ).select_related("event", "event__user")
    if settings.ENABLE_RECURRENCE_OVERRIDES:
        due_reminders = due_reminders.filter(event__recurrence_interval__isnull=True)

    for reminder in due_reminders:
        event = reminder.event
        user_id = event.user_id

        _send_reminder_notification(
            user_id=user_id,
            title=f"Reminder: {event.title}",
            event_title=event.title,
            send_push=reminder.send_push,
        )

        reminder.processed = True
        reminder.save(update_fields=["processed"])

    if not settings.ENABLE_RECURRENCE_OVERRIDES:
        return

    recurring_events = (
        Event.objects.filter(recurrence_interval__isnull=False)
        .prefetch_related("reminders", "overrides", "overrides__categories")
        .order_by("id")
    )

    for event in recurring_events:
        reminder_minutes: set[int] = {
            int(reminder.minutes_before) for reminder in event.reminders.all()
        }
        for override in event.overrides.all():
            for reminder_snapshot in override.reminders_snapshot or []:
                try:
                    reminder_minutes.add(
                        int(reminder_snapshot.get("minutes_before", 0))
                    )
                except (TypeError, ValueError):
                    continue

        if not reminder_minutes:
            continue

        expanded_by_instance_id = {}
        loaded_overrides = list(event.overrides.all())
        for minutes_before in reminder_minutes:
            shift = timedelta(minutes=minutes_before)
            occurrence_start = due_window_start + shift
            occurrence_end = now + shift
            expanded_instances = expand_event_instances(
                event,
                occurrence_start,
                occurrence_end,
                overrides=loaded_overrides,
            )
            for instance in expanded_instances:
                expanded_by_instance_id[instance.instance_id] = instance

        for expanded in expanded_by_instance_id.values():
            for reminder in expanded.reminders:
                try:
                    minutes_before = int(reminder["minutes_before"])
                except (TypeError, ValueError, KeyError):
                    continue

                trigger_at = expanded.start_time - timedelta(minutes=minutes_before)
                if not (due_window_start <= trigger_at <= now):
                    continue

                anchor = expanded.original_start_time or expanded.start_time
                if not _record_dispatch(event, anchor, reminder):
                    continue

                _send_reminder_notification(
                    user_id=event.user_id,
                    title=f"Reminder: {expanded.title}",
                    event_title=expanded.title,
                    send_push=bool(reminder.get("send_push", False)),
                )

    logger.debug("Recurring reminder check completed at %s", now.isoformat())


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
    dispatch_cutoff = timezone.now() - timezone.timedelta(days=90)
    ReminderDispatchLog.objects.filter(dispatched_at__lt=dispatch_cutoff).delete()


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

    recipient_ids = list(recipients.values_list("id", flat=True))
    if not recipient_ids:
        return "Broadcasted to 0 users"

    notifications = [
        Notification(
            recipient_id=user_id,
            title=title,
            message=message,
            notification_type=Notification.NotificationType.ADMIN,
        )
        for user_id in recipient_ids
    ]
    with transaction.atomic():
        created_notifications = Notification.objects.bulk_create(
            notifications,
            batch_size=1000,
        )

    notifications_by_recipient_id = {
        notification.recipient_id: notification
        for notification in created_notifications
    }

    for user_id in recipient_ids:
        unread_count = increment_unread_count(user_id, amount=1)
        notification = notifications_by_recipient_id.get(user_id)
        if notification and notification.id and notification.timestamp:
            notify_user(
                user_id,
                {
                    "type": "new_notification",
                    "notification": {
                        "id": notification.id,
                        "recipient": notification.recipient_id,
                        "sender": notification.sender_id,
                        "sender_username": None,
                        "title": notification.title,
                        "message": notification.message,
                        "is_read": notification.is_read,
                        "timestamp": notification.timestamp.isoformat(),
                        "notification_type": notification.notification_type,
                    },
                    "unread_count": unread_count,
                },
            )
        else:
            notify_user(user_id, {"type": "unread_count", "count": unread_count})
        send_push_notification.delay(user_id, title, message)

    return f"Broadcasted to {len(recipient_ids)} users"
