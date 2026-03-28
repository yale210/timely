from __future__ import annotations

from datetime import datetime
from typing import Any


def _prepared_allocation_slots(
    ensure_allocation_list: Any,
    normalised_slots_or_error: Any,
    ensure_split_is_allowed: Any,
    serializer: Any,
    allocation: Any,
    allow_split: bool,
) -> list[tuple[datetime, datetime]]:
    """Normalise, validate, and sort the raw allocation slot payload.

    Args:
        ensure_allocation_list (Any): Validator that enforces list-shaped input.
        normalised_slots_or_error (Any): Helper that converts raw slots or raises.
        ensure_split_is_allowed (Any): Validator for multiple-slot allocations.
        serializer (Any): The calendar serializer instance.
        allocation (Any): Raw allocation payload.
        allow_split (bool): Whether multiple allocations are permitted.

    Returns:
        list[tuple[datetime, datetime]]: Ordered, validated allocation windows.
    """
    ensure_allocation_list(allocation)
    normalised_slots = normalised_slots_or_error(serializer, allocation)
    ensure_split_is_allowed(normalised_slots, allow_split)
    normalised_slots.sort(key=lambda slot: slot[0])
    return normalised_slots


def _validate_slot_constraints(
    validate_requested_slots: Any,
    validate_remaining_minutes: Any,
    normalised_slots: list[tuple[datetime, datetime]],
    start_time: datetime | None,
    deadline: datetime | None,
    min_split_minutes: int,
    max_split_minutes: int | None,
    estimated_minutes: int,
    completed_minutes: int,
) -> None:
    """Validate slot boundaries and remaining-task capacity in one step."""
    validate_requested_slots(
        normalised_slots,
        start_time,
        deadline,
        min_split_minutes,
        max_split_minutes,
    )
    validate_remaining_minutes(
        normalised_slots,
        estimated_minutes,
        completed_minutes,
    )


def _validate_external_conflicts(
    serializer: Any,
    normalised_slots: list[tuple[datetime, datetime]],
    buffer_before_minutes: int,
    buffer_after_minutes: int,
    categories: list[Any],
) -> None:
    """Delegate external conflict validation back to the serializer instance."""
    serializer._validate_external_conflicts(
        normalised_slots,
        buffer_before_minutes,
        buffer_after_minutes,
        categories,
    )


def _validate_calendar_state(
    validate_start_and_deadline: Any,
    validate_split_limits: Any,
    validate_completed_minutes: Any,
    state: dict[str, Any],
) -> None:
    """Validate the calendar state fields before allocation-specific checks."""
    validate_start_and_deadline(state["start_time"], state["deadline"])
    validate_split_limits(
        state["min_split_minutes"],
        state["max_split_minutes"],
    )
    validate_completed_minutes(
        state["estimated_minutes"],
        state["completed_minutes"],
    )


def _apply_completion_state(
    apply_completion_request: Any,
    set_completed_flag: Any,
    attrs: dict[str, Any],
    state: dict[str, Any],
) -> None:
    """Apply completion-derived state before allocation validation runs."""
    state["completed_minutes"] = apply_completion_request(
        attrs,
        state["estimated_minutes"],
        state["completed_minutes"],
    )
    set_completed_flag(
        attrs,
        state["estimated_minutes"],
        state["completed_minutes"],
    )
