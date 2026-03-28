from __future__ import annotations

from datetime import datetime
from typing import Any

from rest_framework import serializers

from core.calendar_validation_attr_helpers import (
    _apply_completion_state,
    _prepared_allocation_slots,
    _validate_calendar_state,
    _validate_external_conflicts,
    _validate_slot_constraints,
)


def _validate_allocation_slots(serializer: Any, state: dict[str, Any]) -> None:
    """Validate requested allocation windows against task, buffer, and category rules."""
    if state["allocation"] in (None, []):
        return

    normalised_slots = _prepared_allocation_slots(
        _ensure_allocation_list,
        _normalised_slots_or_error,
        _ensure_split_is_allowed,
        serializer,
        state["allocation"],
        state["allow_split"],
    )
    _validate_slot_constraints(
        _validate_requested_slots,
        _validate_remaining_minutes,
        normalised_slots,
        state["start_time"],
        state["deadline"],
        state["min_split_minutes"],
        state["max_split_minutes"],
        state["estimated_minutes"],
        state["completed_minutes"],
    )
    _validate_external_conflicts(
        serializer,
        normalised_slots,
        state["buffer_before_minutes"],
        state["buffer_after_minutes"],
        state["categories"],
    )


def _validate_calendar_attrs(serializer: Any, attrs: dict[str, Any]) -> dict[str, Any]:
    """Run the full calendar validation pipeline and return the cleaned attrs.

    Args:
        serializer (Any): The calendar serializer performing validation.
        attrs (dict[str, Any]): Serializer attributes under validation.

    Returns:
        dict[str, Any]: The validated attribute dictionary.
    """
    state = _validation_state(serializer, attrs)
    _validate_calendar_state(
        _validate_start_and_deadline,
        _validate_split_limits,
        _validate_completed_minutes,
        state,
    )
    _apply_completion_state(
        _apply_completion_request,
        _set_completed_flag,
        attrs,
        state,
    )
    if attrs.get("completed"):
        state["allocation"] = []
        attrs["allocation"] = []
    try:
        _validate_calendar_allocation(serializer, attrs, state)
    except serializers.ValidationError as exc:
        raise serializer._rewrite_buffer_only_conflict(attrs, exc)
    return attrs


def _validate_calendar_allocation(
    serializer: Any,
    attrs: dict[str, Any],
    state: dict[str, Any],
) -> None:
    """Prepare state for allocation validation and run the allocation checks."""
    state["categories"] = _validation_categories(serializer, attrs)
    state["min_split_minutes"] = state["min_split_minutes"] or 15
    state["estimated_minutes"] = state["estimated_minutes"] or 0
    state["completed_minutes"] = state["completed_minutes"] or 0
    _validate_allocation_slots(serializer, state)


def _iter_other_blocked_slots(serializer: Any, other_tasks: list[Any]):
    """Yield buffered allocation windows for all other tasks owned by the user."""
    for task in other_tasks:
        task_slots, _ = serializer._parse_allocation_slots(task.allocation or [])
        for other_start, other_end in task_slots:
            yield serializer._expand_with_buffer(
                other_start,
                other_end,
                task.buffer_before_minutes,
                task.buffer_after_minutes,
            )


def _ensure_allocation_list(allocation: Any) -> None:
    """Require allocation payloads to be lists before slot normalisation.

    Raises:
        ValidationError: If the allocation payload is not a list.
    """
    if not isinstance(allocation, list):
        raise serializers.ValidationError(
            {"allocation": "Allocation must be a list of time slots."}
        )


def _normalised_slots_or_error(
    serializer: Any,
    allocation: list[dict[str, Any]],
) -> list[tuple[datetime, datetime]]:
    """Convert raw allocation rows into validated datetime tuples.

    Returns:
        list[tuple[datetime, datetime]]: The validated slot tuples.

    Raises:
        ValidationError: If any slot fails parsing or shape checks.
    """
    normalised_slots, slot_errors = serializer._parse_allocation_slots(allocation)
    if slot_errors:
        raise serializers.ValidationError({"allocation": slot_errors})
    return normalised_slots


def _ensure_split_is_allowed(
    normalised_slots: list[tuple[datetime, datetime]],
    allow_split: bool,
) -> None:
    """Reject split allocations when the task is not configured for splitting.

    Raises:
        ValidationError: If a multi-slot allocation is submitted without split support.
    """
    if len(normalised_slots) > 1 and not allow_split:
        raise serializers.ValidationError(
            {
                "allocation": (
                    "Tasks without split enabled cannot have multiple allocations."
                )
            }
        )


def _validate_requested_slots(
    normalised_slots: list[tuple[datetime, datetime]],
    start_time: datetime | None,
    deadline: datetime | None,
    min_split_minutes: int,
    max_split_minutes: int | None,
) -> None:
    """Validate every requested slot against timing, length, and overlap rules."""
    for index, slot in enumerate(normalised_slots):
        _validate_requested_slot_timing(slot, start_time, deadline)
        _validate_requested_slot_length(
            normalised_slots,
            slot,
            min_split_minutes,
            max_split_minutes,
        )
        _validate_requested_slot_overlap(normalised_slots, index, slot[0])


def _validate_requested_slot_timing(
    slot: tuple[datetime, datetime],
    start_time: datetime | None,
    deadline: datetime | None,
) -> None:
    """Ensure a requested slot stays within the task's active time window.

    Raises:
        ValidationError: If the slot starts before the task or ends after the deadline.
    """
    slot_start, slot_end = slot
    if start_time is not None and slot_start < start_time:
        raise serializers.ValidationError(
            {
                "allocation": (
                    "Allocation slots cannot begin before the task start time."
                )
            }
        )
    if deadline is not None and slot_end > deadline:
        raise serializers.ValidationError(
            {"allocation": "Allocation slots cannot end after the deadline."}
        )


def _validate_requested_slot_length(
    normalised_slots: list[tuple[datetime, datetime]],
    slot: tuple[datetime, datetime],
    min_split_minutes: int,
    max_split_minutes: int | None,
) -> None:
    """Ensure split slots respect the configured min/max block sizes.

    Raises:
        ValidationError: If a split block is too short or too long.
    """
    if len(normalised_slots) == 1:
        return

    slot_minutes = _slot_minutes(slot)
    if slot_minutes < min_split_minutes:
        raise serializers.ValidationError(
            {
                "allocation": (
                    "Allocation slots cannot be shorter than the task minimum "
                    "split length."
                )
            }
        )
    if max_split_minutes is not None and slot_minutes > max_split_minutes:
        raise serializers.ValidationError(
            {
                "allocation": (
                    "Allocation slots cannot be longer than the task maximum "
                    "split length."
                )
            }
        )


def _validate_requested_slot_overlap(
    normalised_slots: list[tuple[datetime, datetime]],
    index: int,
    slot_start: datetime,
) -> None:
    """Reject consecutive allocation windows that overlap one another.

    Raises:
        ValidationError: If the allocation rows overlap.
    """
    if index == 0:
        return
    if normalised_slots[index - 1][1] > slot_start:
        raise serializers.ValidationError(
            {"allocation": "Allocation slots cannot overlap each other."}
        )


def _validate_remaining_minutes(
    normalised_slots: list[tuple[datetime, datetime]],
    estimated_minutes: int,
    completed_minutes: int,
) -> None:
    """Ensure the total allocation duration does not exceed remaining time.

    Raises:
        ValidationError: If the total allocated minutes exceed the remaining minutes.
    """
    remaining_minutes = max(0, estimated_minutes - completed_minutes)
    allocated_minutes = sum(_slot_minutes(slot) for slot in normalised_slots)
    if allocated_minutes > remaining_minutes:
        raise serializers.ValidationError(
            {
                "allocation": (
                    "Allocation slots cannot exceed the task's remaining minutes."
                )
            }
        )


def _slot_minutes(slot: tuple[datetime, datetime]) -> int:
    """Convert a slot tuple into whole minutes.

    Returns:
        int: Whole minutes covered by the slot.
    """
    slot_start, slot_end = slot
    return int((slot_end - slot_start).total_seconds() // 60)


def _validation_state(serializer: Any, attrs: dict[str, Any]) -> dict[str, Any]:
    """Collect the resolved serializer state needed for validation.

    Returns:
        dict[str, Any]: The resolved validation state.
    """
    return {
        "min_split_minutes": _field_value(serializer, attrs, "min_split_minutes"),
        "max_split_minutes": _field_value(serializer, attrs, "max_split_minutes"),
        "estimated_minutes": _field_value(serializer, attrs, "estimated_minutes"),
        "completed_minutes": _field_value(serializer, attrs, "completed_minutes", 0),
        "start_time": _aware_if_present(
            serializer,
            _field_value(serializer, attrs, "start_time"),
        ),
        "deadline": _aware_if_present(
            serializer,
            _field_value(serializer, attrs, "deadline"),
        ),
        "allow_split": _field_value(serializer, attrs, "allow_split", False),
        "buffer_before_minutes": _field_value(
            serializer,
            attrs,
            "buffer_before_minutes",
            0,
        ),
        "buffer_after_minutes": _field_value(
            serializer,
            attrs,
            "buffer_after_minutes",
            0,
        ),
        "allocation": _field_value(serializer, attrs, "allocation", []),
    }


def _field_value(
    serializer: Any,
    attrs: dict[str, Any],
    field_name: str,
    default: Any = None,
) -> Any:
    """Read a field from attrs or fall back to the current serializer instance.

    Returns:
        Any: The resolved field value.
    """
    return attrs.get(field_name, getattr(serializer.instance, field_name, default))


def _aware_if_present(serializer: Any, value: Any) -> Any:
    """Convert present datetimes to aware values without altering null inputs.

    Returns:
        Any: The aware datetime or None.
    """
    if value is None:
        return None
    return serializer._aware(value)


def _validate_start_and_deadline(
    start_time: datetime | None,
    deadline: datetime | None,
) -> None:
    """Require the task start time to be on or before the deadline.

    Raises:
        ValidationError: If the start time is after the deadline.
    """
    if start_time and deadline and start_time > deadline:
        raise serializers.ValidationError(
            {"deadline": "Start time must be before or on the deadline."}
        )


def _validate_split_limits(
    min_split_minutes: int | None,
    max_split_minutes: int | None,
) -> None:
    """Ensure the configured split bounds are internally consistent.

    Raises:
        ValidationError: If the configured max is lower than the minimum.
    """
    if (
        min_split_minutes is not None
        and max_split_minutes is not None
        and max_split_minutes < min_split_minutes
    ):
        raise serializers.ValidationError(
            {
                "max_split_minutes": (
                    "Maximum split block minutes must be greater than or equal to minimum split block minutes."
                )
            }
        )


def _validate_completed_minutes(
    estimated_minutes: int | None,
    completed_minutes: int | None,
) -> None:
    """Ensure completed minutes never exceed estimated minutes.

    Raises:
        ValidationError: If completed minutes are greater than the estimate.
    """
    if (
        estimated_minutes is not None
        and completed_minutes is not None
        and completed_minutes > estimated_minutes
    ):
        raise serializers.ValidationError(
            {
                "completed_minutes": (
                    "Completed minutes cannot be greater than estimated minutes."
                )
            }
        )


def _apply_completion_request(
    attrs: dict[str, Any],
    estimated_minutes: int | None,
    completed_minutes: int | None,
) -> int | None:
    """Synchronise completed-minute fields with the requested completion flag.

    Returns:
        int | None: The resolved completed-minute count.
    """
    completed_requested = attrs.get("completed")
    if completed_requested is True:
        completed_minutes = estimated_minutes
        attrs["completed_minutes"] = completed_minutes
    elif completed_requested is False and "completed_minutes" not in attrs:
        completed_minutes = 0
        attrs["completed_minutes"] = completed_minutes
    return completed_minutes


def _set_completed_flag(
    attrs: dict[str, Any],
    estimated_minutes: int | None,
    completed_minutes: int | None,
) -> None:
    """Set the completed flag when completion reaches or exceeds estimation."""
    attrs["completed"] = bool(
        estimated_minutes is not None
        and completed_minutes is not None
        and completed_minutes >= estimated_minutes
    )


def _validation_categories(serializer: Any, attrs: dict[str, Any]) -> list[Any]:
    """Resolve the category queryset relevant to the current validation run.

    Returns:
        list[Any]: The categories currently attached to the task.
    """
    if "categories" in attrs:
        return list(attrs["categories"])
    if serializer.instance is not None:
        return list(serializer.instance.categories.all())
    return []
