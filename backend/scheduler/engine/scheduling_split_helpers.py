"""Pure helpers for split-task scheduling."""

from __future__ import annotations

from datetime import datetime, timedelta

from scheduler.intervals import minutes_between
from scheduler.scheduler_types import ScheduleResult

DateTimeRange = tuple[datetime, datetime]


def build_split_result(
    task_id: int | None, segments: list[DateTimeRange], remaining: int
) -> ScheduleResult:
    """Construct a split-scheduling result from allocated segments.

    Args:
        task_id (int | None): The task being scheduled.
        segments (list[DateTimeRange]): Allocated time slices.
        remaining (int): Minutes that could not be scheduled.

    Returns:
        ScheduleResult: Success metadata when allocation covered the task,
        otherwise a failure result explaining the shortfall.
    """
    if remaining <= 0 and segments:
        return ScheduleResult(
            task_id=task_id,
            success=True,
            scheduled_start=segments[0][0],
            scheduled_end=segments[-1][1],
            segments=segments,
        )
    return ScheduleResult(
        task_id=task_id,
        success=False,
        reason="Insufficient time within horizon",
        segments=[],
    )


def insufficient_category_minutes(category_minutes: int | None, min_block: int) -> bool:
    """Return true when the category quota is below the minimum block size."""
    return category_minutes is not None and category_minutes < min_block


def has_invalid_split_remainder(day_remaining: int, min_block: int) -> bool:
    """Return true when a non-zero remainder is below the minimum split size."""
    return 0 < day_remaining < min_block


def apply_split_chunk(
    segments: list[DateTimeRange],
    cursor: datetime,
    chunk: int,
    remaining: int,
    category_minutes: int | None,
    buffer_gap: int,
) -> tuple[datetime, int, int | None]:
    """Append one scheduled chunk and update cursors and counters.

    Args:
        segments (list[DateTimeRange]): Already allocated slices for the task.
        cursor (datetime): Start time for the next chunk.
        chunk (int): Minutes allocated in this slice.
        remaining (int): Minutes left to schedule.
        category_minutes (int | None): Remaining per-category quota.
        buffer_gap (int): Gap inserted after the scheduled slice.

    Returns:
        tuple[datetime, int, int | None]: Updated cursor, remaining minutes,
        and remaining category quota.
    """
    next_end = cursor + timedelta(minutes=chunk)
    segments.append((cursor, next_end))
    remaining -= chunk
    if category_minutes is not None:
        category_minutes -= chunk
    cursor = next_end + timedelta(minutes=buffer_gap)
    return cursor, remaining, category_minutes


def next_chunk_minutes(
    start: datetime,
    end: datetime,
    remaining: int,
    min_block: int,
    max_block: int | None,
    category_minutes: int | None,
) -> int | None:
    """Calculate the size of the next valid chunk from a free slot.

    Args:
        start (datetime): Start of the available slot.
        end (datetime): End of the available slot.
        remaining (int): Minutes still required for the task.
        min_block (int): Minimum allowed chunk size.
        max_block (int | None): Optional upper cap for one chunk.
        category_minutes (int | None): Remaining quota for the task category.

    Returns:
        int | None: The next chunk length, or ``None`` if the slot is unusable.
    """
    free_minutes = minutes_between(start, end)
    if free_minutes < min_block and remaining > min_block:
        return None
    chunk = min(remaining, free_minutes)
    if category_minutes is not None:
        chunk = min(chunk, category_minutes)
    if max_block is not None:
        chunk = min(chunk, max_block)
    if chunk < min_block:
        return None
    return chunk
