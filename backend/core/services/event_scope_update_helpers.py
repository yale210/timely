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
    if reminders_data is None:
        return
    event.reminders.all().delete()
    for reminder in _normalise_reminders(reminders_data):
        EventReminder.objects.create(event=event, **reminder)


def _set_exception_date(event: Event, exception_date: date) -> None:
    current = set(event.exception_dates or [])
    current.add(exception_date.isoformat())
    event.exception_dates = sorted(current)
    event.save(update_fields=["exception_dates"])


def _remove_exception_date(event: Event, exception_date: date) -> None:
    current = set(event.exception_dates or [])
    value = exception_date.isoformat()
    if value not in current:
        return
    current.remove(value)
    event.exception_dates = sorted(current)
    event.save(update_fields=["exception_dates"])


def _category_id_set(values: Iterable[Any]) -> set[int]:
    ids: set[int] = set()
    for value in values:
        ids.add(int(value.id) if hasattr(value, "id") else int(value))
    return ids


def _canonicalise_reminders(
    reminders_data: list[ReminderData],
) -> list[tuple[int, bool, bool]]:
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
    """Detach overrides that no longer match the parent recurrence rule."""
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
    """Resolve the final field values for a scope-this override edit."""
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
    """Resolve the final reminder snapshot and categories for scope-this edits."""
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
    """Return whether a scope-this update leaves the instance unchanged."""
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
    """Persist the resolved scope-this override state and relations."""
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
    """Build the payload used to create a split child series."""
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
    """Create the child series used for a scope-following update."""
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
    """Copy or override categories and reminders onto a child series."""
    child.categories.set(validated_data.get("categories", parent_categories))
    reminders_for_child = validated_data.get("reminders", parent_reminders)
    for reminder in _normalise_reminders(reminders_for_child):
        EventReminder.objects.create(event=child, **reminder)


def move_future_overrides(event: Event, child: Event, original_date: date) -> None:
    """Move future overrides from the parent series onto the child series."""
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
    """Trim the parent series to end before the split point, or delete it."""
    if cutoff < event.start_time.date():
        event.delete()
        return
    event.recurrence_end = cutoff
    event.exception_dates = past_exception_dates
    event.save(update_fields=["recurrence_end", "exception_dates"])
