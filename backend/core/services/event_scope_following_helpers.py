from __future__ import annotations

from datetime import date, datetime
from typing import Any, cast

from core.models import Event, EventReminder
from core.services.event_scope_datetime_helpers import (
    _field_value,
    _normalise_following_child_window,
)
from core.services.event_scope_relation_helpers import (
    ReminderData,
    _normalise_reminders,
)


def build_following_child_payload(
    event: Any,
    validated_data: dict[str, Any],
    child_start: datetime,
    child_end: datetime,
    future_exception_dates: list[str],
) -> dict[str, Any]:
    """Build the creation payload for a following-scope child series.

    Returns:
        dict[str, Any]: Model field values used to create the child event.
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
    event: Any,
    validated_data: dict[str, Any],
) -> dict[str, Any]:
    """Build child-series fields while preserving parent values by default.

    Returns:
        dict[str, Any]: The fallback-driven field payload for the split child.
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
    event: Any,
    validated_data: dict[str, Any],
    original_start_time: datetime,
    future_exception_dates: list[str],
) -> Any:
    """Create the child event that represents the following portion of a series.

    Returns:
        Any: Newly created child event.
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
    return cast(Any, Event).objects.create(**child_payload)


def assign_following_child_relations(
    child: Any,
    validated_data: dict[str, Any],
    parent_categories: list[Any],
    parent_reminders: list[ReminderData],
) -> None:
    """Copy categories and reminders onto a following-scope child event."""
    cast(Any, child).categories.set(validated_data.get("categories", parent_categories))
    reminders_for_child = validated_data.get("reminders", parent_reminders)
    for reminder in _normalise_reminders(reminders_for_child):
        cast(Any, EventReminder).objects.create(event=child, **reminder)


def move_future_overrides(event: Any, child: Any, original_date: date) -> None:
    """Reparent overrides at or after the split date onto the child series."""
    future_overrides = list(
        cast(Any, event).overrides.filter(original_start_time__date__gte=original_date)
    )
    for override in future_overrides:
        override.parent_event = child
        override.save(update_fields=["parent_event"])


def truncate_or_delete_parent_series(
    event: Any,
    cutoff: date,
    past_exception_dates: list[str],
) -> None:
    """Trim the parent series to the split boundary or delete it entirely."""
    if cutoff < event.start_time.date():
        event.delete()
        return
    event.recurrence_end = cutoff
    event.exception_dates = past_exception_dates
    event.save(update_fields=["recurrence_end", "exception_dates"])
