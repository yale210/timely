from __future__ import annotations

from datetime import datetime
from typing import Any

from django.db import transaction

from core.services.event_scope_datetime_helpers import (
    _make_aware,
    _normalise_all_scope_datetimes,
)
from core.services.event_scope_persistence_helpers import (
    delete_scope_following,
    delete_scope_this,
    persist_scope_this_update,
    update_scope_following,
)
from core.services.event_scope_update_helpers import (
    _replace_event_reminders,
    detach_non_aligned_overrides,
    resolve_scope_this_fields,
    resolve_scope_this_relations,
)

EVENT_FIELD_NAMES = (
    "title",
    "description",
    "location",
    "start_time",
    "end_time",
    "recurrence_interval",
    "recurrence_end",
)


def _scope_this_update_data(
    event: Any,
    existing_override: Any | None,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> tuple[Any, list[dict[str, Any]], set[int]]:
    """Resolve the payload, reminders, and categories for a single-instance edit.

    Returns:
        tuple[Any, list[dict[str, Any]], set[int]]: The override payload,
            reminder payloads, and category ids.
    """
    payload = resolve_scope_this_fields(
        event,
        existing_override,
        validated_data,
        original_start_time,
    )
    final_reminders, final_category_ids = resolve_scope_this_relations(
        event,
        existing_override,
        validated_data,
    )
    return payload, final_reminders, final_category_ids

def _has_recurrence_pattern_change(
    event: Any,
    validated_data: dict[str, Any],
) -> bool:
    """Detect whether the recurrence pattern itself is being altered.

    Returns:
        bool: True when recurrence interval or end date changes.
    """
    interval_changed = (
        "recurrence_interval" in validated_data
        and validated_data["recurrence_interval"] != event.recurrence_interval
    )
    recurrence_end_changed = (
        "recurrence_end" in validated_data
        and validated_data["recurrence_end"] != event.recurrence_end
    )
    return interval_changed or recurrence_end_changed


def _update_scope_all(
    event: Any,
    validated_data: dict[str, Any],
    original_start_time: datetime | None = None,
) -> Any:
    """Apply a scope='all' update directly to the parent recurring series.

    Returns:
        Any: The updated event instance.
    """
    normalised_data = validated_data
    if event.recurrence_interval:
        anchor_time = original_start_time or event.start_time
        normalised_data = _normalise_all_scope_datetimes(
            event,
            validated_data,
            anchor_time,
        )
    for field_name in EVENT_FIELD_NAMES:
        if field_name in normalised_data:
            setattr(event, field_name, normalised_data[field_name])
    event.save()
    if "categories" in normalised_data:
        event.categories.set(normalised_data["categories"])
    _replace_event_reminders(event, normalised_data.get("reminders"))
    detach_non_aligned_overrides(event)
    return event


def _get_existing_override(
    event: Any,
    original_start_time: datetime,
) -> Any | None:
    """Return the override matching the supplied recurring occurrence anchor.

    Returns:
        Any | None: The matching override row, or None when absent.
    """
    return (
        event.overrides.filter(original_start_time=original_start_time)
        .prefetch_related("categories")
        .first()
    )


def _update_scope_this(
    event: Any,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Any:
    """Persist a scope='this' update by creating or reusing an override row.

    Returns:
        Any: The parent event after the override has been saved.
    """
    original_start_time = _make_aware(original_start_time)
    existing_override = _get_existing_override(event, original_start_time)
    payload, final_reminders, final_category_ids = _scope_this_update_data(
        event,
        existing_override,
        validated_data,
        original_start_time,
    )
    return persist_scope_this_update(
        event, existing_override, payload, final_category_ids, final_reminders, original_start_time
    )


def _update_scope_following(
    event: Any,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Any:
    """Create the split child series and rehome future occurrences to it.

    Returns:
        Any: The newly created child event.
    """
    return update_scope_following(event, validated_data, original_start_time)


def _require_original_start_time(
    original_start_time: datetime | None,
    scope: str,
) -> datetime:
    """Validate and return the original occurrence anchor for scoped mutations."""
    if original_start_time is None:
        raise ValueError(f"original_start_time is required for scope='{scope}'.")
    return original_start_time


def _apply_recurring_update_scope(
    event: Any,
    validated_data: dict[str, Any],
    scope: str,
    original_start_time: datetime | None,
) -> Any:
    """Route recurring event updates to the correct scoped implementation."""
    if scope == "this":
        anchor = _require_original_start_time(original_start_time, "this")
        if _has_recurrence_pattern_change(event, validated_data):
            raise ValueError(
                "Recurrence pattern changes are not supported for scope='this'. "
                "Use scope='following' or scope='all'."
            )
        return _update_scope_this(event, validated_data, anchor)

    if scope == "following":
        anchor = _require_original_start_time(original_start_time, "following")
        return _update_scope_following(event, validated_data, anchor)

    return _update_scope_all(event, validated_data, original_start_time)


def _apply_recurring_delete_scope(
    event: Any,
    scope: str,
    original_start_time: datetime | None,
) -> None:
    """Route recurring event deletions to the correct scoped implementation."""
    if scope == "this":
        _delete_scope_this(event, _require_original_start_time(original_start_time, "this"))
        return

    if scope == "following":
        _delete_scope_following(
            event,
            _require_original_start_time(original_start_time, "following"),
        )
        return

    event.delete()


def _delete_scope_this(event: Any, original_start_time: datetime) -> None:
    """Delete a single overridden occurrence and restore the parent series."""
    delete_scope_this(event, original_start_time)


def _delete_scope_following(event: Any, original_start_time: datetime) -> None:
    """Remove the current and future series fragments from the parent event."""
    delete_scope_following(event, original_start_time)


@transaction.atomic
def apply_update_scope(
    event: Any,
    validated_data: dict[str, Any],
    scope: str,
    original_start_time: datetime | None = None,
) -> Any:
    """Apply an event update using the requested recurrence scope.

    Args:
        event (Any): Event being mutated.
        validated_data (dict[str, Any]): Serializer-validated event data.
        scope (str): Requested mutation scope.
        original_start_time (datetime | None): Recurring instance anchor when needed.

    Returns:
        Any: The updated event or split child event.

    Raises:
        ValueError: If the requested scope is missing its required anchor or uses an unsupported recurrence change.
    """
    if not event.recurrence_interval:
        return _update_scope_all(event, validated_data)
    return _apply_recurring_update_scope(
        event,
        validated_data,
        scope,
        original_start_time,
    )


@transaction.atomic
def apply_delete_scope(
    event: Any,
    scope: str,
    original_start_time: datetime | None = None,
) -> None:
    """Delete an event or recurring slice for the requested scope.

    Args:
        event (Any): Event being deleted.
        scope (str): Requested deletion scope.
        original_start_time (datetime | None): Recurring instance anchor when needed.

    Raises:
        ValueError: If the requested scope is missing its required anchor.
    """
    if not event.recurrence_interval or scope == "all":
        event.delete()
        return
    _apply_recurring_delete_scope(event, scope, original_start_time)


@transaction.atomic
def revert_override_instance(event: Any, original_start_time: datetime) -> None:
    """Remove an override and restore the base recurring instance.

    Args:
        event (Any): Parent recurring event.
        original_start_time (datetime): Anchor datetime for the overridden instance.

    Raises:
        ValueError: If the event is not recurring or no matching override exists.
    """
    if not event.recurrence_interval:
        raise ValueError("Only recurring events can revert overridden instances.")
    original_start_time = _make_aware(original_start_time)
    deleted_count, _ = event.overrides.filter(
        original_start_time=original_start_time
    ).delete()
    if deleted_count == 0:
        raise ValueError("No override exists for the provided original_start_time.")
    _remove_exception_date(event, original_start_time.date())
