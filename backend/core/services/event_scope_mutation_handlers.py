from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from django.db import transaction

from core.services.event_scope_datetime_helpers import (
    _make_aware,
    _normalise_all_scope_datetimes,
)
from core.services.event_scope_update_helpers import (
    _current_event_reminder_snapshot,
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
    event: Any,
    existing_override: Any | None,
    original_start_time: datetime,
) -> Any:
    if existing_override is not None:
        existing_override.delete()
    _remove_exception_date(event, original_start_time.date())
    return event


def _has_recurrence_pattern_change(
    event: Any,
    validated_data: dict[str, Any],
) -> bool:
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
    original_start_time = _make_aware(original_start_time)
    existing_override = _get_existing_override(event, original_start_time)
    payload, final_reminders, final_category_ids = _scope_this_update_data(
        event,
        existing_override,
        validated_data,
        original_start_time,
    )
    return _persist_scope_this_update(
        event,
        existing_override,
        payload,
        final_category_ids,
        final_reminders,
        original_start_time,
    )


def _persist_scope_this_update(
    event: Any,
    existing_override: Any | None,
    payload: Any,
    final_category_ids: set[int],
    final_reminders: list[dict[str, Any]],
    original_start_time: datetime,
) -> Any:
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
    event: Any,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Any:
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
    cutoff = original_date - timedelta(days=1)
    truncate_or_delete_parent_series(event, cutoff, past_exception_dates)
    return child


def _delete_scope_this(event: Any, original_start_time: datetime) -> None:
    original_start_time = _make_aware(original_start_time)
    event.overrides.filter(original_start_time=original_start_time).delete()
    _set_exception_date(event, original_start_time.date())


def _delete_scope_following(event: Any, original_start_time: datetime) -> None:
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
