from __future__ import annotations

from datetime import datetime, time
from typing import Any

from dateutil.rrule import DAILY, MONTHLY, WEEKLY, YEARLY, rrule
from django.utils import timezone

from core.models import Event

FREQ_BY_INTERVAL = {
    Event.RecurrenceInterval.DAILY: DAILY,
    Event.RecurrenceInterval.WEEKLY: WEEKLY,
    Event.RecurrenceInterval.MONTHLY: MONTHLY,
    Event.RecurrenceInterval.YEARLY: YEARLY,
}


def _make_aware(value: Any) -> Any:
    """Convert a datetime-like value to an aware datetime when required.

    Returns:
        Any: The aware datetime value.
    """
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def serialise_event_reminders(event: Any) -> list[dict[str, Any]]:
    """Serialise event reminders in deterministic order.

    Returns:
        list[dict[str, Any]]: Reminder payloads ordered by trigger timing.
    """
    return [
        {
            "id": reminder.id,
            "send_email": reminder.send_email,
            "send_push": reminder.send_push,
            "minutes_before": reminder.minutes_before,
        }
        for reminder in event.reminders.all().order_by("minutes_before", "id")
    ]


def _get_event_rule_until(event: Any, window_end: datetime) -> Any:
    """Clamp the recurrence rule to the series end or the requested window.

    Returns:
        Any: The recurrence cutoff datetime.
    """
    if not event.recurrence_end:
        return window_end
    series_tz = event.start_time.tzinfo or timezone.get_current_timezone()
    recurrence_end_dt = datetime.combine(event.recurrence_end, time.max)
    if timezone.is_naive(recurrence_end_dt):
        recurrence_end_dt = timezone.make_aware(recurrence_end_dt, series_tz)
    return min(recurrence_end_dt, window_end)


def _build_event_rrule(event: Any, window_end: datetime) -> rrule | None:
    """Create an RRULE for the event when a recognised interval is configured.

    Returns:
        rrule | None: The recurrence rule, or None when the series is not repeatable.
    """
    if not event.recurrence_interval:
        return None
    frequency: Any = FREQ_BY_INTERVAL.get(event.recurrence_interval)
    if frequency is None:
        return None
    until = _get_event_rule_until(event, window_end)
    if until < event.start_time:
        return None
    return rrule(frequency, dtstart=event.start_time, until=until)


def _generate_occurrence_starts(
    event: Any,
    range_start: datetime,
    range_end: datetime,
) -> list[datetime]:
    """Generate occurrence anchors that fall inside the requested range.

    Returns:
        list[datetime]: Matching occurrence start datetimes.
    """
    if not event.recurrence_interval:
        if event.start_time <= range_end and event.end_time >= range_start:
            return [event.start_time]
        return []
    if event.start_time > range_end:
        return []
    rule = _build_event_rrule(event, range_end)
    if rule is None:
        return []
    return [dt for dt in rule.between(range_start, range_end, inc=True)]


def is_occurrence_in_series(event: Any, occurrence_start: datetime) -> bool:
    """Check whether an occurrence anchor belongs to the event's recurrence rule.

    Returns:
        bool: True when the occurrence is part of the series.
    """
    occurrence_start = _make_aware(occurrence_start)
    if not event.recurrence_interval:
        return event.start_time == occurrence_start
    if occurrence_start < event.start_time:
        return False
    if event.recurrence_end and occurrence_start.date() > event.recurrence_end:
        return False
    rule = _build_event_rrule(event, occurrence_start)
    if rule is None:
        return False
    previous = rule.before(occurrence_start, inc=True)
    return previous == occurrence_start
