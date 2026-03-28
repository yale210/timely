from __future__ import annotations

from collections.abc import Iterable
from datetime import date
from typing import Any, cast

from core.models import Event, EventReminder
from core.services.recurrence_instances import (
    is_occurrence_in_series,
    serialise_event_reminders,
)

ReminderData = dict[str, Any]


def _normalise_reminders(
    reminders_data: list[ReminderData] | None,
) -> list[ReminderData]:
    """Coerce reminder payload values into the canonical storage shape.

    Returns:
        list[ReminderData]: Normalised reminder payloads.
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


def _current_event_reminder_snapshot(event: Any) -> list[ReminderData]:
    """Capture the event's current reminders in a mutation-safe structure.

    Returns:
        list[ReminderData]: The current reminder snapshot.
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
    event: Any,
    reminders_data: list[ReminderData] | None,
) -> None:
    """Replace all reminders on an event when a new payload is provided."""
    if reminders_data is None:
        return
    cast(Any, event).reminders.all().delete()
    for reminder in _normalise_reminders(reminders_data):
        cast(Any, EventReminder).objects.create(event=event, **reminder)


def _set_exception_date(event: Any, exception_date: date) -> None:
    """Record a recurring-instance exception date on the parent event."""
    current = set(cast(Any, event).exception_dates or [])
    current.add(exception_date.isoformat())
    cast(Any, event).exception_dates = sorted(current)
    cast(Any, event).save(update_fields=["exception_dates"])


def _remove_exception_date(event: Any, exception_date: date) -> None:
    """Remove a recurring-instance exception date when the occurrence is restored."""
    current = set(cast(Any, event).exception_dates or [])
    value = exception_date.isoformat()
    if value not in current:
        return
    current.remove(value)
    cast(Any, event).exception_dates = sorted(current)
    cast(Any, event).save(update_fields=["exception_dates"])


def _category_id_set(values: Iterable[Any]) -> set[int]:
    """Convert category objects or ids into a stable integer id set.

    Returns:
        set[int]: The normalised category ids.
    """
    ids: set[int] = set()
    for value in values:
        ids.add(int(value.id) if hasattr(value, "id") else int(value))
    return ids


def _canonicalise_reminders(
    reminders_data: list[ReminderData],
) -> list[tuple[int, bool, bool]]:
    """Sort reminder payloads into a deterministic comparison tuple format.

    Returns:
        list[tuple[int, bool, bool]]: The reminder comparison tuples.
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
    """Separate exception dates into historical and future partitions.

    Returns:
        tuple[list[str], list[str]]: Past dates first, future dates second.
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


def _create_detached_event(event: Any, override: Any) -> Any:
    """Materialise a detached non-recurring event from an override snapshot.

    Returns:
        Any: The detached event created from the override.
    """
    detached = cast(Any, Event).objects.create(
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
    cast(Any, detached).categories.set(cast(Any, override).categories.all())
    return detached


def detach_non_aligned_overrides(event: Any) -> None:
    """Detach overrides that no longer align with the parent recurrence rule."""
    detached_exception_dates: set[str] = set()
    overrides = list(cast(Any, event).overrides.prefetch_related("categories").all())
    for override in overrides:
        if is_occurrence_in_series(event, override.original_start_time):
            continue
        detached = _create_detached_event(event, override)
        for reminder in _normalise_reminders(override.reminders_snapshot):
            cast(Any, EventReminder).objects.create(event=detached, **reminder)
        detached_exception_dates.add(override.original_start_time.date().isoformat())
        override.delete()
    if not detached_exception_dates:
        return
    cast(Any, event).exception_dates = sorted(
        value
        for value in (cast(Any, event).exception_dates or [])
        if value not in detached_exception_dates
    )
    cast(Any, event).save(update_fields=["exception_dates"])
