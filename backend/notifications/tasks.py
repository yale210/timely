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
from notifications.models import (
    BroadcastJob,
    BroadcastRecipient,
    Notification,
    PushSubscription,
)
from notifications.utils.unread_count import refresh_unread_count
from notifications.utils.websocket import notify_user, send_websocket_notification

logger = logging.getLogger(__name__)
User = get_user_model()


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
        notification_type=Notification.NotificationType.CALENDAR,
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


def _send_push_notification_sync(user_id, title, message):
    subscriptions = PushSubscription.objects.filter(user_id=user_id)
    if not subscriptions.exists():
        return {"success": True, "error_code": "", "error_message": ""}

    payload = json.dumps({"title": title, "message": message})
    had_success = False
    error_message = ""

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
            had_success = True
        except WebPushException as ex:
            if ex.response and ex.response.status_code in [404, 410]:
                sub.delete()
            if not error_message:
                error_message = str(ex)

    if had_success:
        return {"success": True, "error_code": "", "error_message": ""}
    return {
        "success": False,
        "error_code": "PUSH_PROVIDER_FAILURE",
        "error_message": error_message or "Push provider delivery failed.",
    }


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
    _send_push_notification_sync(user_id, title, message)


@shared_task
def cleanup_old_notifications():
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    Notification.objects.filter(timestamp__lt=thirty_days_ago).delete()
    dispatch_cutoff = timezone.now() - timezone.timedelta(days=90)
    ReminderDispatchLog.objects.filter(dispatched_at__lt=dispatch_cutoff).delete()


def _build_broadcast_queryset(target, user_ids=None):
    user_ids = user_ids or []
    base_queryset = User.objects.filter(is_active=True)
    if target == BroadcastJob.Target.ALL:
        return base_queryset
    if target == BroadcastJob.Target.STAFF:
        return base_queryset.filter(is_staff=True)
    if target == BroadcastJob.Target.ADMIN:
        return base_queryset.filter(is_superuser=True)
    if target == BroadcastJob.Target.USERS and user_ids:
        return base_queryset.filter(id__in=user_ids)
    return User.objects.none()


@shared_task
def process_broadcast_job(broadcast_job_id):
    broadcast = (
        BroadcastJob.objects.select_related("sender")
        .filter(id=broadcast_job_id)
        .first()
    )
    if not broadcast:
        return "Broadcast not found"

    if broadcast.status not in {
        BroadcastJob.Status.QUEUED,
        BroadcastJob.Status.IN_PROGRESS,
    }:
        return f"Broadcast already processed with status={broadcast.status}"

    broadcast.status = BroadcastJob.Status.IN_PROGRESS
    broadcast.started_at = timezone.now()
    broadcast.save(update_fields=["status", "started_at", "updated_at"])

    recipients = list(
        BroadcastRecipient.objects.filter(broadcast_job=broadcast).select_related(
            "recipient"
        )
    )
    if not recipients:
        broadcast.status = BroadcastJob.Status.FAILED
        broadcast.completed_at = timezone.now()
        broadcast.failed_count = 0
        broadcast.delivered_count = 0
        broadcast.provider_errors = [
            {
                "code": "ZERO_AUDIENCE",
                "message": "Broadcast has no recipients.",
            }
        ]
        broadcast.save(
            update_fields=[
                "status",
                "completed_at",
                "failed_count",
                "delivered_count",
                "provider_errors",
                "updated_at",
            ]
        )
        return "Broadcast has no recipients"

    sender_username = broadcast.sender.username if broadcast.sender else None
    notifications = [
        Notification(
            recipient_id=recipient.recipient_id,
            sender_id=broadcast.sender_id,
            title=broadcast.title,
            message=broadcast.message,
            notification_type=Notification.NotificationType.SYSTEM,
        )
        for recipient in recipients
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

    delivered_count = 0
    failed_count = 0
    provider_errors = []
    now = timezone.now()

    for recipient in recipients:
        notification = notifications_by_recipient_id.get(recipient.recipient_id)
        recipient.notification = notification
        recipient.last_attempt_at = now

        unread_count = refresh_unread_count(recipient.recipient_id)
        if notification and notification.id and notification.timestamp:
            notify_user(
                recipient.recipient_id,
                {
                    "type": "new_notification",
                    "notification": {
                        "id": notification.id,
                        "recipient": notification.recipient_id,
                        "sender": notification.sender_id,
                        "sender_username": sender_username,
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
            notify_user(
                recipient.recipient_id,
                {"type": "unread_count", "count": unread_count},
            )

        push_result = _send_push_notification_sync(
            recipient.recipient_id,
            broadcast.title,
            broadcast.message,
        )
        if push_result["success"]:
            recipient.status = BroadcastRecipient.DeliveryStatus.SENT
            recipient.error_code = ""
            recipient.error_message = ""
            delivered_count += 1
        else:
            recipient.status = BroadcastRecipient.DeliveryStatus.FAILED
            recipient.error_code = push_result["error_code"]
            recipient.error_message = push_result["error_message"]
            failed_count += 1
            provider_errors.append(
                {
                    "recipient_id": recipient.recipient_id,
                    "code": push_result["error_code"],
                    "message": push_result["error_message"],
                }
            )

    BroadcastRecipient.objects.bulk_update(
        recipients,
        [
            "notification",
            "status",
            "error_code",
            "error_message",
            "last_attempt_at",
            "updated_at",
        ],
    )

    broadcast.delivered_count = delivered_count
    broadcast.failed_count = failed_count
    if failed_count == 0:
        broadcast.status = BroadcastJob.Status.COMPLETED
    elif delivered_count == 0:
        broadcast.status = BroadcastJob.Status.FAILED
    else:
        broadcast.status = BroadcastJob.Status.PARTIAL

    broadcast.provider_errors = provider_errors
    broadcast.completed_at = timezone.now()
    broadcast.save(
        update_fields=[
            "status",
            "delivered_count",
            "failed_count",
            "provider_errors",
            "completed_at",
            "updated_at",
        ]
    )

    return (
        f"Processed broadcast #{broadcast.id} "
        f"(sent={delivered_count}, failed={failed_count})"
    )


@shared_task
def broadcast_notification(title, message, target="all", user_ids=None):
    """
    Legacy-compatible broadcast helper retained for existing tests and scripts.
    """
    if target not in {
        BroadcastJob.Target.ALL,
        BroadcastJob.Target.STAFF,
        BroadcastJob.Target.ADMIN,
        BroadcastJob.Target.USERS,
    }:
        return "Invalid target"

    recipient_ids = list(
        _build_broadcast_queryset(target, user_ids).values_list("id", flat=True)
    )
    if not recipient_ids:
        return "Broadcasted to 0 users"

    with transaction.atomic():
        broadcast = BroadcastJob.objects.create(
            sender=None,
            title=title,
            message=message,
            target=target,
            audience_filters={"target": target, "user_ids": user_ids or []},
            audience_snapshot={
                "recipient_ids": recipient_ids,
                "recipient_count": len(recipient_ids),
            },
            recipient_count=len(recipient_ids),
            status=BroadcastJob.Status.QUEUED,
        )
        BroadcastRecipient.objects.bulk_create(
            [
                BroadcastRecipient(broadcast_job=broadcast, recipient_id=recipient_id)
                for recipient_id in recipient_ids
            ],
            batch_size=1000,
        )
    process_broadcast_job(broadcast.id)
    return f"Broadcasted to {len(recipient_ids)} users"
