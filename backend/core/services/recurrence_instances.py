"""Logic for expanding recurring events into individual instances.

This module provides utilities for taking an Event model—which may have
recurrence rules (rrule), exception dates, and specific EventOverrides—and
materialising it into a list of ExpandedEventInstance objects within a given
time window.
"""

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
    """Ensure a datetime object is timezone-aware.

    If the provided datetime is already aware, it is returned unchanged.
    Otherwise, it is made aware using the default timezone.

    Args:
        value (datetime): The datetime to check or convert.

    Returns:
        datetime: A timezone-aware datetime object.

    """
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def serialise_event_reminders(event: Event) -> list[dict[str, Any]]:
    """Serialise event reminders into stable API-style dictionaries.

    Args:
        event (Event): The event whose reminders should be serialised.

    Returns:
        list[dict[str, Any]]: A list of dictionaries containing reminder metadata.

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


def _get_event_rule_until(event: Event, window_end: datetime) -> datetime:
    """Determine the upper boundary for an event's recurrence rule.

    Calculates whether the series should end at the specified window boundary
    or at the event's own recurrence_end date.

    Args:
        event (Event): The recurring event.
        window_end (datetime): The end of the expansion window.

    Returns:
        datetime: The calculated 'until' boundary for the rrule.

    """
    if not event.recurrence_end:
        return window_end
    series_tz = event.start_time.tzinfo or timezone.get_current_timezone()
    recurrence_end_dt = datetime.combine(event.recurrence_end, time.max)
    if timezone.is_naive(recurrence_end_dt):
        recurrence_end_dt = timezone.make_aware(recurrence_end_dt, series_tz)
    return min(recurrence_end_dt, window_end)


def _build_event_rrule(event: Event, window_end: datetime) -> rrule | None:
    """Construct a dateutil rrule for a recurring event.

    Args:
        event (Event): The event containing recurrence metadata.
        window_end (datetime): The end of the expansion window.

    Returns:
        rrule | None: An rrule instance if the event is recurring and valid
            within the window, otherwise None.

    """
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
    """Generate all potential occurrence start times for an event in a window.

    Args:
        event (Event): The event to expand.
        range_start (datetime): The start of the expansion window.
        range_end (datetime): The end of the expansion window.

    Returns:
        list[datetime]: A list of datetime objects representing valid starts.

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


def is_occurrence_in_series(event: Event, occurrence_start: datetime) -> bool:
    """Return whether an occurrence belongs to the event's recurrence rule.

    Args:
        event (Event): The recurring event series.
        occurrence_start (datetime): The start time to validate.

    Returns:
        bool: True if the start time is a valid point in the recurrence series.

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


def _build_expanded_content(
    event: Event,
    range_start: datetime,
    range_end: datetime,
    overrides: list[EventOverride] | None,
):
    """Prefetch and prepare data required for event expansion.

    Collects categories, reminders, and overrides to avoid redundant
    database queries during the expansion loop.

    Args:
        event (Event): The event to prepare.
        range_start (datetime): Start of the window.
        range_end (datetime): End of the window.
        overrides (list[EventOverride] | None): Optional pre-fetched overrides.

    Returns:
        tuple: A collection of prepared data and caches.

    """
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
    """Evaluate if a base occurrence falls within the visible range.

    Args:
        event (Event): The parent event.
        occurrence_start (datetime): Start of the occurrence.
        occurrence_end (datetime): End of the occurrence.
        range_start (datetime): Start of the window.
        range_end (datetime): End of the window.

    Returns:
        bool: True if the occurrence overlaps with the window.

    """
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
    """Create an instance from an EventOverride.

    Args:
        override (EventOverride): The override data.
        event (Event): The parent event series.
        range_start (datetime): Start of the window.
        range_end (datetime): End of the window.
        reminder_cache (list): Serialised reminders for the event.

    Returns:
        tuple: (The ExpandedEventInstance or None, the override ID).

    """
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
    """Create a standard instance for a specific point in a series.

    Args:
        event (Event): The parent event series.
        occurrence_start (datetime): Start of this occurrence.
        occurrence_end (datetime): End of this occurrence.
        range_start (datetime): Start of the window.
        range_end (datetime): End of the window.
        category_cache (list): Cached category instances.
        reminder_cache (list): Serialised reminders.

    Returns:
        tuple: (The ExpandedEventInstance or None, None).

    """
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
    """Decide and build either an override or a base instance for a start time.

    Args:
        event (Event): The parent event.
        occurrence_start (datetime): The point in time to expand.
        range_start (datetime): Window start.
        range_end (datetime): Window end.
        duration (timedelta): Standard duration of instances.
        exception_dates (set): Dates where occurrences should be skipped.
        overrides_by_original (dict): Map of start times to overrides.
        category_cache (list): Cached categories.
        reminder_cache (list): Cached reminders.

    Returns:
        tuple: (The ExpandedEventInstance or None, optional override ID).

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
    """Create instances for overrides that don't match standard series points.

    Args:
        event (Event): Parent event.
        loaded_overrides (list): All overrides for the event.
        seen_override_ids (set): IDs of overrides already processed.
        range_start (datetime): Window start.
        range_end (datetime): Window end.
        reminder_cache (list): Cached reminders.

    Returns:
        list[ExpandedEventInstance]: List of standalone override instances.

    """
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
    """Iterate through the rrule series and collect matching instances.

    Args:
        event (Event): Parent event.
        range_start (datetime): Window start.
        range_end (datetime): Window end.
        duration (timedelta): Standard duration.
        exception_dates (set): Exceptions to skip.
        overrides_by_original (dict): Map of points to overrides.
        category_cache (list): Categories.
        reminder_cache (list): Reminders.

    Returns:
        tuple: (List of instances, Set of processed override IDs).

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
    """Expand an event into materialised instances within the requested window.

    This is the primary entry point for expanding a single event series.

    Args:
        event (Event): The event to expand.
        range_start (datetime): The beginning of the window to populate.
        range_end (datetime): The end of the window to populate.
        overrides (list[EventOverride] | None): Optional pre-fetched overrides
            to optimise performance.

    Returns:
        list[ExpandedEventInstance]: A chronologically sorted list of instances.

    """
    content = _build_expanded_content(event, range_start, range_end, overrides)
    return _build_sorted_instances(event, content)


def _collect_sorted_instance_parts(event: Event, content):
    """Bridge logic for collecting instances and tracking seen overrides.

    Args:
        event (Event): Parent event.
        content (tuple): The prepared data from _build_expanded_content.

    Returns:
        tuple: A collection of instances and state for sorting and finalisation.

    """
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
    """Assemble all instances, add standalone overrides, and sort.

    Args:
        event (Event): Parent event.
        content (tuple): Prepared expansion metadata.

    Returns:
        list[ExpandedEventInstance]: Final sorted list of instances.

    """
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
    """Add overrides that were not captured by the standard recurrence rules.

    Args:
        instances (list): The list of instances to append to.
        event (Event): Parent event.
        loaded_overrides (list): All event overrides.
        seen_override_ids (set): Set of already expanded override IDs.
        range_start (datetime): Window start.
        range_end (datetime): Window end.
        reminder_cache (list): Cached reminders.

    """
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
    """Expand every visible event for a user within the requested window.

    This function filters events accessible by the user, prefetches necessary
    relationships, and expands each event in parallel using expand_event_instances.

    Args:
        user (Any): The user instance (or ID) for which to expand events.
        range_start (datetime): Window start.
        range_end (datetime): Window end.

    Returns:
        list[ExpandedEventInstance]: A globally sorted list of all instances.

    """
    range_start = _make_aware(range_start)
    range_end = _make_aware(range_end)
    event_filter = _build_user_event_filter(range_start, range_end)
    events = _get_events_for_user(user, event_filter)
    instances = _expand_prefetched_events(
        events, range_start, range_end, expand_event_instances
    )
    return sorted(instances, key=lambda instance: instance.start_time)
