"""Core logic for scoped mutations (updates and deletions) on events.

This module handles the complex logic of applying changes to recurring events,
including 'this' (single occurrence), 'following' (this and future occurrences),
and 'all' (entire series) scopes. It manages EventOverride creation, series
truncation, and the creation of child event series.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from django.db import transaction

from core.models import Event, EventOverride
from core.services.event_scope_datetime_helpers import (
    _make_aware,
    _normalise_all_scope_datetimes,
    _resolve_submitted_occurrence_window,
)
from core.services.event_scope_update_helpers import (
    _category_id_set,
    _current_event_reminder_snapshot,
    _normalise_reminders,
    _remove_exception_date,
    _replace_event_reminders,
    _set_exception_date,
    _split_exception_dates,
    assign_following_child_relations,
    create_following_child,
    detach_non_aligned_overrides,
    move_future_overrides,
    resolve_scope_this_fields,
    resolve_scope_this_relations,
    save_scope_this_override,
    scope_this_is_noop,
    truncate_or_delete_parent_series,
)


__all__ = (
    "apply_update_scope",
    "apply_delete_scope",
    "revert_override_instance",
    "_category_id_set",
    "_normalise_reminders",
    "_resolve_submitted_occurrence_window",
    "_detach_non_aligned_overrides",
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


_detach_non_aligned_overrides = detach_non_aligned_overrides


def _scope_this_update_data(
    event: Event,
    existing_override: EventOverride | None,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> tuple[Any, list[dict[str, Any]], set[int]]:
    """Resolve and prepare all data required for a 'this' scope update.

    Args:
        event (Event): The parent event.
        existing_override (EventOverride | None): Existing override if present.
        validated_data (dict): The update payload.
        original_start_time (datetime): The original start time of the instance.

    Returns:
        tuple: (Prepared fields payload, prepared reminders, category ID set).

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


def _cleanup_scope_this_noop(
    event: Event,
    existing_override: EventOverride | None,
    original_start_time: datetime,
) -> Event:
    """Revert a 'this' scope change if the resulting state matches the series.

    If an update makes an instance identical to the base series again, we
    delete any existing override and remove the exception date.

    Args:
        event (Event): The parent event.
        existing_override (EventOverride | None): The override to remove.
        original_start_time (datetime): The point in time to revert.

    Returns:
        Event: The updated event series.

    """
    if existing_override is not None:
        existing_override.delete()
    _remove_exception_date(event, original_start_time.date())
    return event


def _has_recurrence_pattern_change(
    event: Event,
    validated_data: dict[str, Any],
) -> bool:
    """Check if the update payload contains changes to recurrence rules.

    Args:
        event (Event): The current event state.
        validated_data (dict): The update payload.

    Returns:
        bool: True if interval or end date are changing.

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
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime | None = None,
) -> Event:
    """Update an event by applying changes across all occurrences.
<<<<<<< HEAD
=======

>>>>>>> 5ded433200bfe3694b6104f0db9d21c3d5fd874f
    Recurring events normalise submitted start and end times,
    updates fields, and synchronises related overrides.

    Args:
        event (Event): The event to update.
        validated_data (dict): The new field data.
        original_start_time (datetime | None): Optional reference start time.

    Returns:
        Event: The updated event instance.

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
    event: Event,
    original_start_time: datetime,
) -> EventOverride | None:
    """Retrieve an existing EventOverride for a specific occurrence point.

    Args:
        event (Event): The parent event.
        original_start_time (datetime): The original start time of the occurrence.

    Returns:
        EventOverride | None: The found override instance or None.

    """
    return (
        event.overrides.filter(original_start_time=original_start_time)
        .prefetch_related("categories")
        .first()
    )


def _update_scope_this(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Event:
    """Update only a single specific occurrence of a recurring series.

    Creates or updates an EventOverride and sets an exception date in
    the parent event to hide the base instance.

    Args:
        event (Event): Parent event series.
        validated_data (dict): The update payload.
        original_start_time (datetime): The point in time to override.

    Returns:
        Event: The parent event (with updated state/overrides).

    """
    original_start_time = _make_aware(original_start_time)
    existing_override = _get_existing_override(event, original_start_time)
    payload, final_reminders, final_category_ids = _scope_this_update_data(
        event, existing_override, validated_data, original_start_time
    )
    # If the update results in no changes, remove any existing override.
    if scope_this_is_noop(
        event,
        payload,
        final_category_ids,
        final_reminders,
        original_start_time,
    ):
        return _cleanup_scope_this_noop(event, existing_override, original_start_time)
    save_scope_this_override(
        event,
        existing_override,
        original_start_time,
        payload,
        final_reminders,
        final_category_ids,
    )
    _set_exception_date(event, original_start_time.date())
    return event


def _update_scope_following(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Event:
    """Split a recurring series at a specific point, creating a new child series.

    The parent series is truncated at the split point, and a new child event
    is created to handle all future occurrences (including potential new rules).

    Args:
        event (Event): The parent series to split.
        validated_data (dict): Data for the new child series.
        original_start_time (datetime): The point at which to split.

    Returns:
        Event: The newly created child event series.

    """
    original_start_time = _make_aware(original_start_time)
    original_date = original_start_time.date()
    parent_categories = list(event.categories.all())
    parent_reminders = _current_event_reminder_snapshot(event)
    past_exception_dates, future_exception_dates = _split_exception_dates(
        event.exception_dates,
        original_date,
    )
    child = create_following_child(
        event,
        validated_data,
        original_start_time,
        future_exception_dates,
    )
    assign_following_child_relations(
        child,
        validated_data,
        parent_categories,
        parent_reminders,
    )
    move_future_overrides(event, child, original_date)
    # End the original series the day before the first edited occurrence.
    cutoff = original_date - timedelta(days=1)
    truncate_or_delete_parent_series(event, cutoff, past_exception_dates)
    return child


def _delete_scope_this(event: Event, original_start_time: datetime) -> None:
    """Delete only a specific occurrence of a series by setting an exception date.

    Args:
        event (Event): The parent series.
        original_start_time (datetime): The point in time to remove.

    """
    original_start_time = _make_aware(original_start_time)
    event.overrides.filter(original_start_time=original_start_time).delete()
    _set_exception_date(event, original_start_time.date())


def _delete_scope_following(event: Event, original_start_time: datetime) -> None:
    """Delete an occurrence and all subsequent ones by truncating the series.

    Args:
        event (Event): The parent series.
        original_start_time (datetime): The first occurrence to delete.

    """
    original_start_time = _make_aware(original_start_time)
    original_date = original_start_time.date()
    cutoff = original_date - timedelta(days=1)
    event.overrides.filter(original_start_time__date__gte=original_date).delete()
    past_exception_dates, _ = _split_exception_dates(
        event.exception_dates, original_date
    )
    truncate_or_delete_parent_series(event, cutoff, past_exception_dates)


@transaction.atomic
def apply_update_scope(
    event: Event,
    validated_data: dict[str, Any],
    scope: str,
    original_start_time: datetime | None = None,
) -> Event:
    """Apply an update to one occurrence, the full series, or all following events.

    Args:
        event (Event): The event to update.
        validated_data (dict): The update payload.
        scope (str): One of 'this', 'following', or 'all'.
        original_start_time (datetime | None): Point in time for 'this'/'following'.

    Returns:
        Event: The resulting event (parent or new child).

    Raises:
        ValueError: If required parameters are missing or scope/payload are invalid.

    """
    if not event.recurrence_interval:
        return _update_scope_all(event, validated_data)
    if scope == "this":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='this'.")
        if _has_recurrence_pattern_change(event, validated_data):
            raise ValueError(
                "Recurrence pattern changes are not supported for scope='this'. "
                "Use scope='following' or scope='all'."
            )
        return _update_scope_this(event, validated_data, original_start_time)
    if scope == "following":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='following'.")
        return _update_scope_following(event, validated_data, original_start_time)
    return _update_scope_all(event, validated_data, original_start_time)


@transaction.atomic
def apply_delete_scope(
    event: Event,
    scope: str,
    original_start_time: datetime | None = None,
) -> None:
    """Delete one occurrence, the full series, or all following events.

    Args:
        event (Event): The event to delete.
        scope (str): One of 'this', 'following', or 'all'.
        original_start_time (datetime | None): Point in time for 'this'/'following'.

    Raises:
        ValueError: If required parameters are missing.

    """
    if not event.recurrence_interval or scope == "all":
        event.delete()
        return
    if scope == "this":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='this'.")
        _delete_scope_this(event, original_start_time)
        return
    if scope == "following":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='following'.")
        _delete_scope_following(event, original_start_time)
        return
    event.delete()


@transaction.atomic
def revert_override_instance(event: Event, original_start_time: datetime) -> None:
    """Remove an override so the original recurring instance is shown again.

    Args:
        event (Event): The parent recurring event.
        original_start_time (datetime): The point in time to revert.

    Raises:
        ValueError: If event is not recurring or no override exists.

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
