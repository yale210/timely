from __future__ import annotations

from datetime import datetime

from rest_framework import serializers


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


def _slot_minutes(slot: tuple[datetime, datetime]) -> int:
    """Convert a slot tuple into whole minutes.

    Returns:
        int: Whole minutes covered by the slot.
    """
    slot_start, slot_end = slot
    return int((slot_end - slot_start).total_seconds() // 60)
