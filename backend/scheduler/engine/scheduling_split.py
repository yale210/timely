"""Mixin for split-task scheduling logic in the scheduler engine."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from core.models import Task
from scheduler.intervals import minutes_between
from scheduler.scheduler_types import ScheduleResult

DateTimeRange = tuple[datetime, datetime]
SplitLimits = tuple[int, int | None]


class _SchedulerSplitSchedulingMixin:
    """Internal mixin providing algorithms for splitting tasks across time slots.

    This mixin handles the logic of breaking a single task into multiple
    contiguous chunks (segments) when it cannot fit into a single available
    block, respecting minimum and maximum split durations.
    """

    def _split_task_limits(self, task: Task) -> SplitLimits:
        """Determine the minimum and maximum allowed durations for task splits.

        Args:
            task: The Task object being scheduled.

        Returns:
            A tuple of (min_minutes, max_minutes) where max_minutes can be None.
        """
        return (
            getattr(task, "min_split_minutes", self.min_block_minutes),
            getattr(task, "max_split_minutes", None),
        )

    def _build_split_result(
        self,
        task: Task,
        segments: list[DateTimeRange],
        remaining: int,
    ) -> ScheduleResult:
        """Construct a ScheduleResult from a collection of split segments.

        Args:
            task: The task that was scheduled.
            segments: The list of allocated time segments.
            remaining: The number of minutes that could not be allocated.

        Returns:
            A ScheduleResult object indicating success if all minutes were
            allocated, or failure otherwise.
        """
        if remaining <= 0 and segments:
            return ScheduleResult(
                task_id=task.id,  # type: ignore[arg-type]
                success=True,
                scheduled_start=segments[0][0],
                scheduled_end=segments[-1][1],
                segments=segments,
            )
        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=False,
            reason="Insufficient time within horizon",
            segments=[],
        )

    def _schedule_task_split(self, task: Task, start_date: date) -> ScheduleResult:
        """Attempt to schedule a task by splitting it across multiple slots.

        This is the main entry point for split scheduling, searching through
        available time until the task's remaining duration reaches zero.

        Args:
            task: The Task to schedule.
            start_date: The date to begin searching from.

        Returns:
            A ScheduleResult object containing the allocated segments.
        """
        remaining = self._get_task_remaining_minutes(task)
        if remaining <= 0:
            return self._empty_success(task)
        task_start = self._aware(task.start_time)
        deadline = self._aware(task.deadline)
        limits = self._split_task_limits(task)
        search_start = self._task_search_start(task_start, start_date)
        segments, remaining = self._collect_split_segments(
            task,
            search_start,
            task_start,
            deadline,
            remaining,
            limits,
        )
        return self._build_split_result(task, segments, remaining)

    def _collect_split_segments(
        self,
        task: Task,
        search_start: date,
        task_start: datetime,
        deadline: datetime,
        remaining: int,
        limits: SplitLimits,
    ) -> tuple[list[DateTimeRange], int]:
        """Iterate through dates to collect segments for a split task.

        Args:
            task: The Task being scheduled.
            search_start: The date to begin the search.
            task_start: Earliest allowed start time.
            deadline: Latest allowed end time.
            remaining: Minutes remaining to be scheduled.
            limits: The split duration limits.

        Returns:
            A tuple of (collected_segments, remaining_minutes).
        """
        segments: list[DateTimeRange] = []
        min_block, _ = limits
        for current_date in self._iter_search_dates(search_start, deadline):
            if remaining <= 0:
                break
            if not self._is_day_available(current_date):
                continue
            day_segments, day_remaining = self._schedule_split_day(
                task, current_date, task_start, deadline, segments, remaining, limits
            )
            if not day_segments or self._has_invalid_split_remainder(
                day_remaining, min_block
            ):
                continue
            segments.extend(day_segments)
            remaining = day_remaining
        return segments, remaining

    def _schedule_split_day(
        self,
        task: Task,
        current_date: date,
        task_start: datetime,
        deadline: datetime,
        segments: list[DateTimeRange],
        remaining: int,
        limits: SplitLimits,
    ) -> tuple[list[DateTimeRange], int]:
        """Find split segments for a task on a specific day.

        Args:
            task: The Task being scheduled.
            current_date: The date to inspect.
            task_start: Global task start boundary.
            deadline: Global task deadline boundary.
            segments: Segments already allocated to this task in previous days.
            remaining: Minutes still needed.
            limits: Split duration limits.

        Returns:
            A tuple of (day_segments, new_remaining_minutes).
        """
        min_block, _ = limits
        category_minutes = self._get_remaining_category_minutes(
            task,
            current_date,
            current_segments=segments,
        )
        if self._insufficient_category_minutes(category_minutes, min_block):
            return [], remaining
        slots = self._split_day_slots(
            task, current_date, min_block, task_start, deadline
        )
        return self._split_segments_for_slots(
            task, slots, task_start, deadline, remaining, limits, category_minutes
        )

    def _split_day_slots(
        self,
        task: Task,
        current_date: date,
        min_block: int,
        task_start: datetime,
        deadline: datetime,
    ) -> list[DateTimeRange]:
        """Retrieve potential time slots for a specific day and task.

        Args:
            task: The Task being scheduled.
            current_date: The date to check.
            min_block: Minimum required duration for a slot.
            task_start: Task's start boundary.
            deadline: Task's deadline boundary.

        Returns:
            A list of available datetime tuples.
        """
        return self._task_slots_for_date(
            task, current_date, min_block, task_start, deadline
        )

    @staticmethod
    def _insufficient_category_minutes(
        category_minutes: int | None, min_block: int
    ) -> bool:
        """Check if the remaining category quota is below the minimum block size.

        Args:
            category_minutes: Remaining daily minutes for the task's categories.
            min_block: The minimum allowed duration for a task segment.

        Returns:
            bool: True if category quota is insufficient.
        """
        return category_minutes is not None and category_minutes < min_block

    @staticmethod
    def _has_invalid_split_remainder(day_remaining: int, min_block: int) -> bool:
        """Check if the remaining minutes fall below the minimum allowed split.

        Args:
            day_remaining: Minutes left after a day's allocation.
            min_block: Minimum allowed split duration.

        Returns:
            bool: True if the remainder is invalid (non-zero and too small).
        """
        return 0 < day_remaining < min_block

    def _split_segments_for_slots(
        self,
        task: Task,
        slots: list[DateTimeRange],
        task_start: datetime,
        deadline: datetime,
        remaining: int,
        limits: SplitLimits,
        category_minutes: int | None,
    ) -> tuple[list[DateTimeRange], int]:
        """Allocate task segments across a list of available slots.

        Args:
            task: The Task being scheduled.
            slots: List of candidate available slots for the day.
            task_start: Task start boundary.
            deadline: Task deadline boundary.
            remaining: Total minutes needed.
            limits: Split duration limits.
            category_minutes: Remaining category quota for the day.

        Returns:
            A tuple of (allocated_segments, new_remaining_minutes).
        """
        day_remaining = remaining
        day_segments: list[DateTimeRange] = []
        for slot in slots:
            candidate = self._candidate_split_slot(task, slot, task_start, deadline)
            if not candidate:
                continue
            next_segments, day_remaining, category_minutes = self._split_slot(
                task,
                candidate,
                day_remaining,
                limits,
                category_minutes,
            )
            day_segments.extend(next_segments)
            if day_remaining <= 0:
                break
        return day_segments, day_remaining

    def _candidate_split_slot(
        self,
        task: Task,
        slot: DateTimeRange,
        task_start: datetime,
        deadline: datetime,
    ) -> DateTimeRange | None:
        """Clip and validate a raw slot for split scheduling.

        Args:
            task: The Task being scheduled.
            slot: The raw available slot.
            task_start: Task start boundary.
            deadline: Task deadline boundary.

        Returns:
            A clipped datetime tuple, or None if invalid.
        """
        return self._clip_slot(self._task_slot(task, slot), task_start, deadline)

    def _split_slot(
        self,
        task: Task,
        slot: DateTimeRange,
        remaining: int,
        limits: SplitLimits,
        category_minutes: int | None,
    ) -> tuple[list[DateTimeRange], int, int | None]:
        """Break a single contiguous slot into chunks based on task requirements.

        Args:
            task: The Task being scheduled.
            slot: The contiguous available slot.
            remaining: Minutes still needed for the task.
            limits: Split duration limits.
            category_minutes: Remaining category quota for the day.

        Returns:
            A tuple of (new_segments, remaining_minutes, remaining_category_minutes).
        """
        min_block, max_block = limits
        segments: list[DateTimeRange] = []
        buffer_gap = sum(self._get_task_buffer_minutes(task))
        cursor, end = slot
        while remaining > 0 and cursor < end:
            if self._insufficient_category_minutes(category_minutes, min_block):
                return segments, remaining, category_minutes
            chunk = self._next_chunk_minutes(
                cursor, end, remaining, min_block, max_block, category_minutes
            )
            if chunk is None:
                return segments, remaining, category_minutes
            cursor, remaining, category_minutes = self._apply_split_chunk(
                segments, cursor, chunk, remaining, category_minutes, buffer_gap
            )
        return segments, remaining, category_minutes

    @staticmethod
    def _apply_split_chunk(
        segments: list[DateTimeRange],
        cursor: datetime,
        chunk: int,
        remaining: int,
        category_minutes: int | None,
        buffer_gap: int,
    ) -> tuple[datetime, int, int | None]:
        """Finalise a single chunk of time and update cursors and counters.

        Args:
            segments: The list of segments to append the chunk to.
            cursor: Current starting point within the slot.
            chunk: Duration of the chunk to allocate.
            remaining: Overall remaining minutes for the task.
            category_minutes: Daily category quota remaining.
            buffer_gap: Buffer time to apply after the segment.

        Returns:
            A tuple of (next_cursor, updated_remaining, updated_category_minutes).
        """
        next_end = cursor + timedelta(minutes=chunk)
        segments.append((cursor, next_end))
        remaining -= chunk
        if category_minutes is not None:
            category_minutes -= chunk
        cursor = next_end + timedelta(minutes=buffer_gap)
        return cursor, remaining, category_minutes

    @staticmethod
    def _next_chunk_minutes(
        start: datetime,
        end: datetime,
        remaining: int,
        min_block: int,
        max_block: int | None,
        category_minutes: int | None,
    ) -> int | None:
        """Calculate the size of the next chunk that can be carved from a slot.

        Args:
            start: Start of the available space.
            end: End of the available space.
            remaining: Overall minutes still needed.
            min_block: Minimum segment duration.
            max_block: Maximum segment duration.
            category_minutes: Remaining category quota.

        Returns:
            The size of the next chunk in minutes, or None if no valid chunk fits.
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
