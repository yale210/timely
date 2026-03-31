from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from core.services.event_scope_datetime_helpers import _make_aware
from core.services.event_scope_update_helpers import (
    _current_event_reminder_snapshot,
    _remove_exception_date,
    _set_exception_date,
    _split_exception_dates,
    assign_following_child_relations,
    create_following_child,
    move_future_overrides,
    save_scope_this_override,
    scope_this_is_noop,
    truncate_or_delete_parent_series,
)


def _cleanup_scope_this_noop(
    event: Any,
    existing_override: Any | None,
    original_start_time: datetime,
) -> Any:
    """Drop the temporary override and restore the base event occurrence.

    Args:
        event (Any): Parent recurring event being restored.
        existing_override (Any | None): Override row to remove when present.
        original_start_time (datetime): Anchor datetime for the occurrence.

    Returns:
        Any: The parent event, restored to the pre-edit state.
    """
    if existing_override is not None:
        existing_override.delete()
    _remove_exception_date(event, original_start_time.date())
    return event


def persist_scope_this_update(
    event: Any,
    existing_override: Any | None,
    payload: Any,
    final_category_ids: set[int],
    final_reminders: list[dict[str, Any]],
    original_start_time: datetime,
) -> Any:
    """Persist or discard a single-instance override based on the diff.

    Args:
        event (Any): Parent recurring event being updated.
        existing_override (Any | None): Existing override row, if any.
        payload (Any): Serialized update payload.
        final_category_ids (set[int]): Final category set for the override.
        final_reminders (list[dict[str, Any]]): Final reminder payloads.
        original_start_time (datetime): Anchor datetime for the occurrence.

    Returns:
        Any: The updated event or the restored parent event.
    """
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


def _build_following_split_context(
    event: Any, original_start_time: datetime
) -> tuple[datetime.date, list[Any], list[dict[str, Any]], list[str], list[str]]:
    """Collect the parent-series context needed for a following-scope split.

    Args:
        event (Any): Parent recurring event being split.
        original_start_time (datetime): Anchor datetime for the split point.

    Returns:
        tuple[datetime.date, list[Any], list[dict[str, Any]], list[str], list[str]]:
        The split date, cached categories/reminders, and preserved exception
        date partitions.
    """
    original_date = original_start_time.date()
    parent_categories = list(event.categories.all())
    parent_reminders = _current_event_reminder_snapshot(event)
    past_exception_dates, future_exception_dates = _split_exception_dates(
        event.exception_dates,
        original_date,
    )
    return (
        original_date,
        parent_categories,
        parent_reminders,
        past_exception_dates,
        future_exception_dates,
    )


def update_scope_following(
    event: Any,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Any:
    """Create the split child series and rehome future occurrences to it.

    Args:
        event (Any): Parent recurring event being updated.
        validated_data (dict[str, Any]): Serializer-validated event payload.
        original_start_time (datetime): Anchor datetime for the split point.

    Returns:
        Any: The newly created child event.
    """
    original_start_time = _make_aware(original_start_time)
    (
        original_date,
        parent_categories,
        parent_reminders,
        past_exception_dates,
        future_exception_dates,
    ) = _build_following_split_context(event, original_start_time)
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
    truncate_or_delete_parent_series(
        event,
        original_date - timedelta(days=1),
        past_exception_dates,
    )
    return child


def delete_scope_this(event: Any, original_start_time: datetime) -> None:
    """Delete a single overridden occurrence and restore the parent series."""
    original_start_time = _make_aware(original_start_time)
    event.overrides.filter(original_start_time=original_start_time).delete()
    _set_exception_date(event, original_start_time.date())


def delete_scope_following(event: Any, original_start_time: datetime) -> None:
    """Remove the current and future series fragments from the parent event."""
    original_start_time = _make_aware(original_start_time)
    original_date = original_start_time.date()
    event.overrides.filter(original_start_time__date__gte=original_date).delete()
    past_exception_dates, _ = _split_exception_dates(
        event.exception_dates,
        original_date,
    )
    truncate_or_delete_parent_series(
        event,
        original_date - timedelta(days=1),
        past_exception_dates,
    )
