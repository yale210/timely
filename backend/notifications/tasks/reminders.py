import json
import hashlib
import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Max, Q
from django.utils import timezone

from core.models import Event, ReminderDispatchLog
from core.models.event_reminder import EventReminder
from core.services import expand_event_instances
from notifications.models import Notification

logger = logging.getLogger(__name__)


def _send_reminder_notification(
    *,
    user_id,
    title: str,
    event_title: str,
    send_push: bool,
):
    """
    Creates and saves a reminder notification.
    """
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
    """
    Generates a unique signature for a reminder to prevent duplicate dispatches.
    """
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
    """
    Records a reminder dispatch in the database. Returns False if already dispatched.
    """
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
    """
    Celery task to check for due event reminders and send notifications.
    """
    now = timezone.now()
    due_window_start = now - timedelta(minutes=1)

    _process_non_recurring_reminders(now)

    if not settings.ENABLE_RECURRENCE_OVERRIDES:
        return

    recurring_events = _get_due_recurring_events(now, due_window_start)

    for event in recurring_events:
        reminder_minutes = _collect_reminder_minutes(event)

        if not reminder_minutes:
            continue

        expanded_by_instance_id = _expand_instances_for_reminders(
            event, reminder_minutes, due_window_start, now
        )

        for expanded in expanded_by_instance_id.values():
            _process_due_reminders(event, expanded, now, due_window_start)

    logger.debug("Recurring reminder check completed at %s", now.isoformat())


def _process_due_reminders(event, expanded, now, due_window_start):
    """
    Processes due reminders for a specific expanded event instance.
    """
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


def _expand_instances_for_reminders(event, reminder_minutes, due_window_start, now):
    """
    Expands recurring event instances within the reminder window.
    """
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
    return expanded_by_instance_id


def _collect_reminder_minutes(event) -> set[int]:
    """
    Collects all unique reminder offsets (in minutes) for an event and its overrides.
    """
    reminder_minutes: set[int] = {
        int(reminder.minutes_before) for reminder in event.reminders.all()
    }
    for override in event.overrides.all():
        _add_override_reminders(reminder_minutes, override)

    return reminder_minutes


def _add_override_reminders(reminder_minutes: set[int], override):
    """
    Adds reminders from an override snapshot to the set.
    """
    for reminder_snapshot in override.reminders_snapshot or []:
        minutes = _check_minutes(reminder_snapshot.get("minutes_before", 0))
        if minutes is not None:
            reminder_minutes.add(minutes)


def _process_non_recurring_reminders(now):
    """
    Processes reminders for non-recurring events.
    """
    due_reminders = EventReminder.objects.filter(
        trigger_at__lte=now,
        processed=False,
    ).select_related("event", "event__user")
    
    if settings.ENABLE_RECURRENCE_OVERRIDES:
        due_reminders = due_reminders.filter(event__recurrence_interval__isnull=True)

    for reminder in due_reminders:
        event = reminder.event

        _send_reminder_notification(
            user_id=event.user_id,
            title=f"Reminder: {event.title}",
            event_title=event.title,
            send_push=reminder.send_push,
        )

        reminder.processed = True
        reminder.save(update_fields=["processed"])


def _get_due_recurring_events(now, due_window_start):
    """
    Retrieves recurring events that might have due reminders.
    """
    max_offset_minutes = (
        EventReminder.objects.filter(
            event__recurrence_interval__isnull=False,
        ).aggregate(max_minutes=Max("minutes_before"))["max_minutes"]
        or 0
    )
    max_offset = timedelta(minutes=max_offset_minutes)

    return (
        Event.objects.filter(recurrence_interval__isnull=False)
        .filter(
            Q(reminders__isnull=False) | Q(overrides__isnull=False),
        )
        .filter(start_time__lte=now + max_offset)
        .filter(
            Q(recurrence_end__isnull=True)
            | Q(recurrence_end__gte=due_window_start.date()),
        )
        .prefetch_related("reminders", "overrides", "overrides__categories")
        .distinct()
        .order_by("id")
    )


def _check_minutes(value):
    """
    Validates and converts a value to an integer minute.
    """
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
