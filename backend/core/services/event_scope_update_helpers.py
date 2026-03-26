"""Helper functions for managing event updates and series splits.

This module contains internal logic for normalising reminders, managing
exception dates, resolving override fields, and handling the complex
orchestration required to split event series for 'following' scope updates.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Iterable

from core.models import Event, EventOverride, EventReminder
from core.services.event_scope_datetime_helpers import (
    _field_value,
    _normalise_following_child_window,
)
from core.services.recurrence_instances import (
    is_occurrence_in_series,
    serialise_event_reminders,
)


ReminderData = dict[str, Any]


@dataclass(frozen=True)
class ScopeThisFields:
    """Resolved field values for a single-occurrence override update."""

    title: str
    description: str
    location: str
    start_time: datetime
    end_time: datetime


def _normalise_reminders(
    reminders_data: list[ReminderData] | None,
) -> list[ReminderData]:
    """Coerce raw reminder data into a consistent dictionary format.

    Args:
        reminders_data (list | None): The raw reminder payloads.

    Returns:
        list[dict[str, Any]]: Normalised reminder list.

    """
    if reminders_data is None:
        return []
    return [
        {
            "send_email": bool(reminder.get("send_email", False)),
            "send_push": bool(reminder.get("send_push", False)),
            "minutes_before": int(reminder.get("minutes_before", 0)),
        }
        for reminder in reminders_data
    ]


def _current_event_reminder_snapshot(event: Event) -> list[ReminderData]:
    """Capture the current reminders of an event as a serialisable list.

    Args:
        event (Event): The event to snapshot.

    Returns:
        list[dict[str, Any]]: A list of reminder dictionaries.

    """
    reminder_rows = serialise_event_reminders(event)
    return [
        {
            "send_email": bool(reminder["send_email"]),
            "send_push": bool(reminder["send_push"]),
            "minutes_before": int(reminder["minutes_before"]),
        }
        for reminder in reminder_rows
    ]


def _replace_event_reminders(
    event: Event,
    reminders_data: list[ReminderData] | None,
) -> None:
    """Delete existing reminders and replace them with new data.

    Args:
        event (Event): The event to modify.
        reminders_data (list | None): The new reminder payloads.

    """
    if reminders_data is None:
        return
    event.reminders.all().delete()
    for reminder in _normalise_reminders(reminders_data):
        EventReminder.objects.create(event=event, **reminder)


def _set_exception_date(event: Event, exception_date: date) -> None:
    """Add a date to the event's exception_dates list.

    Args:
        event (Event): The event to update.
        exception_date (date): The date to mark as an exception.

    """
    current = set(event.exception_dates or [])
    current.add(exception_date.isoformat())
    event.exception_dates = sorted(current)
    event.save(update_fields=["exception_dates"])


def _remove_exception_date(event: Event, exception_date: date) -> None:
    """Remove a date from the event's exception_dates list.

    Args:
        event (Event): The event to update.
        exception_date (date): The date to remove from exceptions.

    """
    current = set(event.exception_dates or [])
    value = exception_date.isoformat()
    if value not in current:
        return
    current.remove(value)
    event.exception_dates = sorted(current)
    event.save(update_fields=["exception_dates"])


def _category_id_set(values: Iterable[Any]) -> set[int]:
    """Convert a mix of objects and IDs into a unique set of integer IDs.

    Args:
        values (Iterable): Collection of model instances or primary keys.

    Returns:
        set[int]: A set of integer IDs.

    """
    ids: set[int] = set()
    for value in values:
        ids.add(int(value.id) if hasattr(value, "id") else int(value))
    return ids


def _canonicalise_reminders(
    reminders_data: list[ReminderData],
) -> list[tuple[int, bool, bool]]:
    """Convert reminders into a sorted list of tuples for equality comparison.

    Args:
        reminders_data (list): List of reminder dictionaries.

    Returns:
        list[tuple]: Sorted collection of reminder state.

    """
    return sorted(
        (
            int(reminder["minutes_before"]),
            bool(reminder["send_email"]),
            bool(reminder["send_push"]),
        )
        for reminder in reminders_data
    )


def _split_exception_dates(
    exception_dates: list[str] | None,
    threshold: date,
) -> tuple[list[str], list[str]]:
    """Partition exception dates into those before and after a threshold.

    Used when splitting a recurring series to ensure exceptions stay with
    the correct series.

    Args:
        exception_dates (list | None): Current ISO date strings.
        threshold (date): The date at which to split.

    Returns:
        tuple: (List of past dates, list of future/present dates).

    """
    past: list[str] = []
    future: list[str] = []
    for value in exception_dates or []:
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            continue
        if parsed >= threshold:
            future.append(value)
        else:
            past.append(value)
    return past, future


def _create_detached_event(event: Event, override: EventOverride) -> Event:
    """Create a standalone non-recurring event from an existing override.

    Args:
        event (Event): Parent series.
        override (EventOverride): The override record to promote.

    Returns:
        Event: The new standalone event.

    """
    detached = Event.objects.create(
        user=event.user,
        title=override.title,
        description=override.description,
        location=override.location,
        start_time=override.start_time,
        end_time=override.end_time,
        recurrence_interval=None,
        recurrence_end=None,
        exception_dates=[],
    )
    detached.categories.set(override.categories.all())
    return detached


def detach_non_aligned_overrides(event: Event) -> None:
    """Detach overrides that no longer match the parent recurrence rule.

    If the series recurrence rules change, any overrides that no longer
    align with the new rrule points are promoted to standalone events.

    Args:
        event (Event): The updated event series.

    """
    detached_exception_dates: set[str] = set()
    overrides = list(event.overrides.prefetch_related("categories").all())
    for override in overrides:
        if is_occurrence_in_series(event, override.original_start_time):
            continue
        detached = _create_detached_event(event, override)
        for reminder in _normalise_reminders(override.reminders_snapshot):
            EventReminder.objects.create(event=detached, **reminder)
        detached_exception_dates.add(override.original_start_time.date().isoformat())
        override.delete()
    if not detached_exception_dates:
        return
    event.exception_dates = sorted(
        value
        for value in (event.exception_dates or [])
        if value not in detached_exception_dates
    )
    event.save(update_fields=["exception_dates"])


def _scope_this_default_values(
    event: Event,
    existing_override: EventOverride | None,
    original_start_time: datetime,
) -> dict[str, Any]:
    """Retrieve existing field values to use as fallbacks for 'this' updates.

    Args:
        event (Event): Parent series.
        existing_override (EventOverride | None): Current override state.
        original_start_time (datetime): Point in time.

    Returns:
        dict[str, Any]: Mapping of field names to fallback values.

    """
    duration = event.end_time - event.start_time
    if existing_override is None:
        return {
            "title": event.title,
            "description": event.description,
            "location": event.location,
            "start_time": original_start_time,
            "end_time": original_start_time + duration,
        }
    return {
        "title": existing_override.title,
        "description": existing_override.description,
        "location": existing_override.location,
        "start_time": existing_override.start_time,
        "end_time": existing_override.end_time,
    }


def resolve_scope_this_fields(
    event: Event,
    existing_override: EventOverride | None,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> ScopeThisFields:
    """Resolve the final field values for a scope-this override edit.

    Args:
        event (Event): Parent series.
        existing_override (EventOverride | None): Current override record.
        validated_data (dict): Submitted update data.
        original_start_time (datetime): Split point.

    Returns:
        ScopeThisFields: The resolved field values.

    """
    defaults = _scope_this_default_values(
        event,
        existing_override,
        original_start_time,
    )
    resolved_values = {
        name: _field_value(validated_data, name, fallback=fallback)
        for name, fallback in defaults.items()
    }
    return ScopeThisFields(**resolved_values)


def resolve_scope_this_relations(
    event: Event,
    existing_override: EventOverride | None,
    validated_data: dict[str, Any],
) -> tuple[list[ReminderData], set[int]]:
    """Resolve the final reminder snapshot and categories for scope-this edits.

    Handles merging submitted values with existing override data or parent
    series conventions.

    Args:
        event (Event): Parent series.
        existing_override (EventOverride | None): Current override.
        validated_data (dict): Submitted changes.

    Returns:
        tuple: (Normalised reminder list, Set of category IDs).

    """
    if "reminders" in validated_data:
        final_reminders = _normalise_reminders(validated_data["reminders"])
    elif existing_override and existing_override.reminders_snapshot:
        final_reminders = _normalise_reminders(existing_override.reminders_snapshot)
    else:
        final_reminders = _current_event_reminder_snapshot(event)
    if "categories" in validated_data:
        final_category_ids = _category_id_set(validated_data["categories"])
    elif existing_override is None:
        final_category_ids = _category_id_set(event.categories.all())
    else:
        final_category_ids = _category_id_set(existing_override.categories.all())
    return final_reminders, final_category_ids


def scope_this_is_noop(
    event: Event,
    payload: ScopeThisFields,
    final_category_ids: set[int],
    final_reminders: list[ReminderData],
    original_start_time: datetime,
) -> bool:
    """Return whether a scope-this update leaves the instance unchanged.

    Compares the proposed override state against the parent series to
    see if the override is redundant.

    Args:
        event (Event): Parent series.
        payload (ScopeThisFields): Proposed override fields.
        final_category_ids (set): Proposed categories.
        final_reminders (list): Proposed reminders.
        original_start_time (datetime): Original series start point.

    Returns:
        bool: True if the update matches the base series exactly.

    """
    duration = event.end_time - event.start_time
    base_end = original_start_time + duration
    return (
        payload.title == event.title
        and payload.description == event.description
        and payload.location == event.location
        and payload.start_time == original_start_time
        and payload.end_time == base_end
        and final_category_ids == _category_id_set(event.categories.all())
        and _canonicalise_reminders(final_reminders)
        == _canonicalise_reminders(_current_event_reminder_snapshot(event))
    )


def save_scope_this_override(
    event: Event,
    existing_override: EventOverride | None,
    original_start_time: datetime,
    payload: ScopeThisFields,
    final_reminders: list[ReminderData],
    final_category_ids: set[int],
) -> None:
    """Persist the resolved scope-this override state and relations.

    Args:
        event (Event): Parent series.
        existing_override (EventOverride | None): Record to update (or None).
        original_start_time (datetime): Anchor point.
        payload (ScopeThisFields): New field values.
        final_reminders (list): New reminder snapshot.
        final_category_ids (set): New categories.

    """
    override = existing_override or EventOverride(
        parent_event=event,
        original_start_time=original_start_time,
    )
    override.title = payload.title
    override.description = payload.description
    override.location = payload.location
    override.start_time = payload.start_time
    override.end_time = payload.end_time
    override.reminders_snapshot = final_reminders
    override.save()
    override.categories.set(final_category_ids)


def build_following_child_payload(
    event: Event,
    validated_data: dict[str, Any],
    child_start: datetime,
    child_end: datetime,
    future_exception_dates: list[str],
) -> dict[str, Any]:
    """Build the payload used to create a split child series.

    Args:
        event (Event): Parent series.
        validated_data (dict): Submitted changes.
        child_start (datetime): First occurrence start in new series.
        child_end (datetime): First occurrence end in new series.
        future_exception_dates (list): Exceptions to carry over.

    Returns:
        dict[str, Any]: Arguments for Event.objects.create().

    """
    payload = {
        "user": event.user,
        "start_time": child_start,
        "end_time": child_end,
        "exception_dates": future_exception_dates,
        "split_from_event": event,
    }
    payload.update(_following_child_series_fields(event, validated_data))
    return payload


def _following_child_series_fields(
    event: Event,
    validated_data: dict[str, Any],
) -> dict[str, Any]:
    """Resolve series-level fields for a new child event.

    Args:
        event (Event): Parent series.
        validated_data (dict): Submitted payload.

    Returns:
        dict[str, Any]: Mapping of series fields to values.

    """
    return {
        "title": _field_value(validated_data, "title", fallback=event.title),
        "description": _field_value(
            validated_data,
            "description",
            fallback=event.description,
        ),
        "location": _field_value(validated_data, "location", fallback=event.location),
        "recurrence_interval": _field_value(
            validated_data,
            "recurrence_interval",
            fallback=event.recurrence_interval,
        ),
        "recurrence_end": _field_value(
            validated_data,
            "recurrence_end",
            fallback=event.recurrence_end,
        ),
    }


def create_following_child(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
    future_exception_dates: list[str],
) -> Event:
    """Create the child series used for a scope-following update.

    Args:
        event (Event): Parent series.
        validated_data (dict): Submitted changes.
        original_start_time (datetime): Split point.
        future_exception_dates (list): List of ISO dates to carry over.

    Returns:
        Event: The new child event series.

    """
    child_start, child_end = _normalise_following_child_window(
        event,
        validated_data,
        original_start_time,
    )
    child_payload = build_following_child_payload(
        event,
        validated_data,
        child_start,
        child_end,
        future_exception_dates,
    )
    return Event.objects.create(**child_payload)


def assign_following_child_relations(
    child: Event,
    validated_data: dict[str, Any],
    parent_categories: list[Any],
    parent_reminders: list[ReminderData],
) -> None:
    """Copy or override categories and reminders onto a child series.

    Args:
        child (Event): The newly created series.
        validated_data (dict): Submitted update data.
        parent_categories (list): Fallback categories from parent.
        parent_reminders (list): Fallback reminders from parent.

    """
    child.categories.set(validated_data.get("categories", parent_categories))
    reminders_for_child = validated_data.get("reminders", parent_reminders)
    for reminder in _normalise_reminders(reminders_for_child):
        EventReminder.objects.create(event=child, **reminder)


def move_future_overrides(event: Event, child: Event, original_date: date) -> None:
    """Move future overrides from the parent series onto the child series.

    Args:
        event (Event): Parent series.
        child (Event): Target child series.
        original_date (date): The threshold date.

    """
    future_overrides = list(
        event.overrides.filter(original_start_time__date__gte=original_date)
    )
    for override in future_overrides:
        override.parent_event = child
        override.save(update_fields=["parent_event"])


def truncate_or_delete_parent_series(
    event: Event,
    cutoff: date,
    past_exception_dates: list[str],
) -> None:
    """Trim the parent series to end before the split point, or delete it.

    Args:
        event (Event): The parent series.
        cutoff (date): The new recurrence_end.
        past_exception_dates (list): Exceptions that occurred before cutoff.

    """
    if cutoff < event.start_time.date():
        event.delete()
        return
    event.recurrence_end = cutoff
    event.exception_dates = past_exception_dates
    event.save(update_fields=["recurrence_end", "exception_dates"])
