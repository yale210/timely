from __future__ import annotations

from datetime import datetime, time
from typing import Any

from dateutil.rrule import DAILY, MONTHLY, WEEKLY, YEARLY, rrule
from django.utils import timezone

from core.models import Event, EventOverride
from core.services.recurrence_event_query_helpers import (
    _build_user_event_filter,
    _expand_prefetched_events,
    _get_events_for_user,
)
from core.services.recurrence_instance_builders import (
    ExpandedEventInstance,
    build_base_instance,
    build_override_instance,
    normalise_reminder_snapshot as _normalise_reminder_snapshot,
)


__all__ = (
    "serialise_event_reminders",
    "is_occurrence_in_series",
    "expand_event_instances",
    "expand_user_events",
    "_normalise_reminder_snapshot",
)


FREQ_BY_INTERVAL = {
    Event.RecurrenceInterval.DAILY: DAILY,
    Event.RecurrenceInterval.WEEKLY: WEEKLY,
    Event.RecurrenceInterval.MONTHLY: MONTHLY,
    Event.RecurrenceInterval.YEARLY: YEARLY,
}


def _make_aware(value: datetime) -> datetime:
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def serialise_event_reminders(event: Event) -> list[dict[str, Any]]:
    """Serialise event reminders into stable API-style dictionaries."""
    return [
        {
            "id": reminder.id,
            "send_email": reminder.send_email,
            "send_push": reminder.send_push,
            "minutes_before": reminder.minutes_before,
        }
        for reminder in event.reminders.all().order_by("minutes_before", "id")
    ]


def _get_event_rule_until(event: Event, window_end: datetime) -> datetime:
    if not event.recurrence_end:
        return window_end
    series_tz = event.start_time.tzinfo or timezone.get_current_timezone()
    recurrence_end_dt = datetime.combine(event.recurrence_end, time.max)
    if timezone.is_naive(recurrence_end_dt):
        recurrence_end_dt = timezone.make_aware(recurrence_end_dt, series_tz)
    return min(recurrence_end_dt, window_end)


def _build_event_rrule(event: Event, window_end: datetime) -> rrule | None:
    if not event.recurrence_interval:
        return None
    frequency = FREQ_BY_INTERVAL.get(event.recurrence_interval)
    if frequency is None:
        return None
    until = _get_event_rule_until(event, window_end)
    if until < event.start_time:
        return None
    return rrule(frequency, dtstart=event.start_time, until=until)


def _generate_occurrence_starts(
    event: Event,
    range_start: datetime,
    range_end: datetime,
) -> list[datetime]:
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


def is_occurrence_in_series(event: Event, occurrence_start: datetime) -> bool:
    """Return whether an occurrence belongs to the event's recurrence rule."""
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


def _build_expanded_content(
    event: Event,
    range_start: datetime,
    range_end: datetime,
    overrides: list[EventOverride] | None,
):
    range_start = _make_aware(range_start)
    range_end = _make_aware(range_end)
    category_cache = list(event.categories.all())
    reminder_cache = serialise_event_reminders(event)
    duration = event.end_time - event.start_time
    exception_dates = set(event.exception_dates or [])
    loaded_overrides = (
        overrides
        if overrides is not None
        else list(event.overrides.prefetch_related("categories").all())
    )
    overrides_by_original = {
        override.original_start_time: override for override in loaded_overrides
    }
    return (
        range_start,
        range_end,
        category_cache,
        reminder_cache,
        duration,
        exception_dates,
        loaded_overrides,
        overrides_by_original,
    )


def _should_include_base_occurrence(
    event: Event,
    occurrence_start: datetime,
    occurrence_end: datetime,
    range_start: datetime,
    range_end: datetime,
) -> bool:
    return range_start <= occurrence_start <= range_end or (
        not event.recurrence_interval
        and occurrence_start <= range_end
        and occurrence_end >= range_start
    )


def _build_override_occurrence(
    override: EventOverride,
    event: Event,
    range_start: datetime,
    range_end: datetime,
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, int | None]:
    if not range_start <= override.start_time <= range_end:
        return None, override.id
    return build_override_instance(
        event, override, reminder_cache=reminder_cache
    ), override.id


def _build_base_occurrence(
    event: Event,
    occurrence_start: datetime,
    occurrence_end: datetime,
    range_start: datetime,
    range_end: datetime,
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, None]:
    if not _should_include_base_occurrence(
        event,
        occurrence_start,
        occurrence_end,
        range_start,
        range_end,
    ):
        return None, None
    return build_base_instance(
        event,
        categories=category_cache,
        reminders=reminder_cache,
        occurrence_start=occurrence_start,
        occurrence_end=occurrence_end,
    ), None


def _build_occurrence_instance(
    event: Event,
    occurrence_start: datetime,
    range_start: datetime,
    range_end: datetime,
    duration,
    exception_dates: set[str],
    overrides_by_original: dict[datetime, EventOverride],
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, int | None]:
    """
    Show the override instance if an override exists for the occurrence.
    """
    override = overrides_by_original.get(occurrence_start)
    if override is not None:
        return _build_override_occurrence(
            override, event, range_start, range_end, reminder_cache
        )
    if occurrence_start.date().isoformat() in exception_dates:
        return None, None
    occurrence_end = occurrence_start + duration
    return _build_base_occurrence(
        event,
        occurrence_start,
        occurrence_end,
        range_start,
        range_end,
        category_cache,
        reminder_cache,
    )


def _build_standalone_override_instances(
    event: Event,
    loaded_overrides: list[EventOverride],
    seen_override_ids: set[int],
    range_start: datetime,
    range_end: datetime,
    reminder_cache: list[dict[str, Any]],
) -> list[ExpandedEventInstance]:
    return [
        build_override_instance(event, override, reminder_cache=reminder_cache)
        for override in loaded_overrides
        if override.id not in seen_override_ids
        and range_start <= override.start_time <= range_end
    ]


def _collect_occurrence_instances(
    event: Event,
    range_start: datetime,
    range_end: datetime,
    duration,
    exception_dates: set[str],
    overrides_by_original: dict[datetime, EventOverride],
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
) -> tuple[list[ExpandedEventInstance], set[int]]:
    """
    Keep track of overrides so that they are not readded later.
    """
    instances: list[ExpandedEventInstance] = []
    seen_override_ids: set[int] = set()
    for occurrence_start in _generate_occurrence_starts(event, range_start, range_end):
        instance, seen_override_id = _build_occurrence_instance(
            event,
            occurrence_start,
            range_start,
            range_end,
            duration,
            exception_dates,
            overrides_by_original,
            category_cache,
            reminder_cache,
        )
        if seen_override_id is not None:
            seen_override_ids.add(seen_override_id)
        if instance is not None:
            instances.append(instance)
    return instances, seen_override_ids


def expand_event_instances(
    event: Event,
    range_start: datetime,
    range_end: datetime,
    *,
    overrides: list[EventOverride] | None = None,
) -> list[ExpandedEventInstance]:
    """Expand an event into materialised instances within the requested window."""
    content = _build_expanded_content(event, range_start, range_end, overrides)
    return _build_sorted_instances(event, content)


def _collect_sorted_instance_parts(event: Event, content):
    (
        range_start,
        range_end,
        category_cache,
        reminder_cache,
        duration,
        exception_dates,
        loaded_overrides,
        overrides_by_original,
    ) = content
    instances, seen_override_ids = _collect_occurrence_instances(
        event,
        range_start,
        range_end,
        duration,
        exception_dates,
        overrides_by_original,
        category_cache,
        reminder_cache,
    )
    return (
        instances,
        seen_override_ids,
        loaded_overrides,
        range_start,
        range_end,
        reminder_cache,
    )


def _build_sorted_instances(event: Event, content) -> list[ExpandedEventInstance]:
    (
        instances,
        seen_override_ids,
        loaded_overrides,
        range_start,
        range_end,
        reminder_cache,
    ) = _collect_sorted_instance_parts(event, content)
    _append_standalone_overrides(
        instances,
        event,
        loaded_overrides,
        seen_override_ids,
        range_start,
        range_end,
        reminder_cache,
    )
    return sorted(instances, key=lambda instance: instance.start_time)


def _append_standalone_overrides(
    instances: list[ExpandedEventInstance],
    event: Event,
    loaded_overrides: list[EventOverride],
    seen_override_ids: set[int],
    range_start: datetime,
    range_end: datetime,
    reminder_cache: list[dict[str, Any]],
) -> None:
    instances.extend(
        _build_standalone_override_instances(
            event,
            loaded_overrides,
            seen_override_ids,
            range_start,
            range_end,
            reminder_cache,
        )
    )


def expand_user_events(
    user: Any,
    range_start: datetime,
    range_end: datetime,
) -> list[ExpandedEventInstance]:
    """Expand every visible event for a user within the requested window."""
    range_start = _make_aware(range_start)
    range_end = _make_aware(range_end)
    event_filter = _build_user_event_filter(range_start, range_end)
    events = _get_events_for_user(user, event_filter)
    instances = _expand_prefetched_events(
        events, range_start, range_end, expand_event_instances
    )
    return sorted(instances, key=lambda instance: instance.start_time)
