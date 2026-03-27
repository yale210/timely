from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from core.models import EventOverride
from core.services.event_scope_datetime_helpers import _field_value
from core.services.event_scope_relation_helpers import (
    ReminderData,
    _canonicalise_reminders,
    _category_id_set,
    _current_event_reminder_snapshot,
    _normalise_reminders,
)


@dataclass(frozen=True)
class ScopeThisFields:
    """Resolved field values for a single-instance recurring override."""

    title: str
    description: str
    location: str
    start_time: datetime
    end_time: datetime


def _scope_this_default_values(
    event: Any,
    existing_override: Any | None,
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
    event: Any,
    existing_override: Any | None,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> ScopeThisFields:
    """Resolve field values for a scope='this' override.

    Returns:
        ScopeThisFields: Final field values to store on the override.
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
    event: Any,
    existing_override: Any | None,
    validated_data: dict[str, Any],
) -> tuple[list[ReminderData], set[int]]:
    """Resolve categories and reminders for a scope='this' override.

    Returns:
        tuple[list[ReminderData], set[int]]: Final reminder payloads and category ids.
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
    event: Any,
    payload: ScopeThisFields,
    final_category_ids: set[int],
    final_reminders: list[ReminderData],
    original_start_time: datetime,
) -> bool:
    """Check whether a scope='this' update matches the base occurrence exactly.

    Returns:
        bool: True when the override would not change the generated instance.
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
    event: Any,
    existing_override: Any | None,
    original_start_time: datetime,
    payload: ScopeThisFields,
    final_reminders: list[ReminderData],
    final_category_ids: set[int],
) -> None:
    """Create or update the stored override for a single recurring instance."""
    override: Any = existing_override or EventOverride(
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
