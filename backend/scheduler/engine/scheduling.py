"""Mixin for scheduling logic in the scheduler engine."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from core.models import Task
from scheduler.intervals import minutes_between
from scheduler.scheduler_types import ScheduleResult


class SchedulerSchedulingMixin:
    """Mixin providing core scheduling algorithms for the scheduler.

    This class contains methods for finding available slots, handling
    task splitting, and managing overall task allocation.
    """

    def _clip_to_deadline(
        self,
        slot: tuple[datetime, datetime],
        deadline: datetime,
    ) -> tuple[datetime, datetime] | None:
        """Clip a time slot so it does not exceed the task's deadline.

        Args:
            slot: The time slot to clip.
            deadline: The deadline for the task.

        Returns:
            The clipped time slot, or None if the slot starts after the deadline.
        """
        start, end = slot
        if end <= deadline:
            return slot
        if start >= deadline:
            return None
        return start, deadline

    def _clip_to_task_start(
        self,
        slot: tuple[datetime, datetime],
        task_start: datetime,
    ) -> tuple[datetime, datetime] | None:
        """Clip a time slot so it does not start before the task's start time.

        Args:
            slot: The time slot to clip.
            task_start: The earliest start time allowed for the task.

        Returns:
            The clipped time slot, or None if the slot ends before the task start.
        """
        start, end = slot
        if end <= task_start:
            return None
        if start < task_start:
            return task_start, end
        return slot

    def _empty_success(self, task: Task) -> ScheduleResult:
        """Create a ScheduleResult indicating successful but empty allocation.

        Args:
            task: The task with no remaining minutes.

        Returns:
            A ScheduleResult object.
        """
        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=True,
            scheduled_start=None,
            scheduled_end=None,
            segments=[],
        )

    @staticmethod
    def _task_search_start(task_start: datetime, start_date: date) -> date:
        """Determine the date to start searching for available slots.

        Args:
            task_start: The task's earliest start time.
            start_date: The proposed scheduling start date.

        Returns:
            The starting date for the search.
        """
        return max(start_date, task_start.date())

    def _task_slot(
        self,
        task: Task,
        slot: tuple[datetime, datetime],
    ) -> tuple[datetime, datetime] | None:
        """Adjust an available slot based on a task's buffer requirements.

        Args:
            task: The task to be scheduled.
            slot: The candidate time slot.

        Returns:
            The adjusted time slot, or None if it cannot accommodate the task.
        """
        return self._shrink_slot_for_task(task, slot)

    def _clip_slot(
        self,
        slot: tuple[datetime, datetime] | None,
        task_start: datetime,
        deadline: datetime,
    ) -> tuple[datetime, datetime] | None:
        """Apply task start and deadline boundaries to a time slot.

        Args:
            slot: The time slot to clip.
            task_start: The task's earliest start time.
            deadline: The task's deadline.

        Returns:
            The clipped time slot, or None if no valid range remains.
        """
        if not slot:
            return None
        clipped = self._clip_to_deadline(slot, deadline)
        if not clipped:
            return None
        return self._clip_to_task_start(clipped, task_start)

    def _single_slot_result(
        self,
        task: Task,
        slot: tuple[datetime, datetime],
        remaining_minutes: int,
    ) -> ScheduleResult:
        """Construct a successful ScheduleResult using a single slot.

        Args:
            task: The scheduled task.
            slot: The selected time slot.
            remaining_minutes: The task duration to allocate.

        Returns:
            A ScheduleResult object.
        """
        start, _ = slot
        end = start + timedelta(minutes=remaining_minutes)
        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=True,
            scheduled_start=start,
            scheduled_end=end,
            segments=[(start, end)],
        )

    def _can_use_single_slot(
        self,
        task: Task,
        slot: tuple[datetime, datetime],
        remaining_minutes: int,
    ) -> bool:
        """Check if a single slot can accommodate a task's remaining time.

        Args:
            task: The task to check.
            slot: The candidate time slot.
            remaining_minutes: The number of minutes to allocate.

        Returns:
            True if the slot can be used, False otherwise.
        """
        category_minutes = self._get_remaining_category_minutes(task, slot[0].date())
        if category_minutes is not None and remaining_minutes > category_minutes:
            return False
        return minutes_between(*slot) >= remaining_minutes

    def _schedule_task_no_split(self, task: Task, start_date: date) -> ScheduleResult:
        """Attempt to schedule a task without splitting it.

        Args:
            task: The task to schedule.
            start_date: The date to start searching from.

        Returns:
            A ScheduleResult object.
        """
        task_start = self._aware(task.start_time)
        deadline = self._aware(task.deadline)
        remaining = self._get_task_remaining_minutes(task)
        if remaining <= 0:
            return self._empty_success(task)
        search_start = self._task_search_start(task_start, start_date)
        for current_date in self._iter_search_dates(search_start, deadline):
            if not self._is_day_available(current_date):
                continue
            slots = self._task_slots_for_date(
                task,
                current_date,
                remaining,
                task_start,
                deadline,
            )
            for slot in slots:
                candidate = self._clip_slot(
                    self._task_slot(task, slot),
                    task_start,
                    deadline,
                )
                if not candidate:
                    continue
                if self._can_use_single_slot(task, candidate, remaining):
                    return self._single_slot_result(task, candidate, remaining)
        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=False,
            reason="No single slot available within horizon",
            segments=[],
        )

    def _schedule_task_split(self, task: Task, start_date: date) -> ScheduleResult:
        """Attempt to schedule a task by splitting it into multiple segments.

        Args:
            task: The task to schedule.
            start_date: The date to start searching from.

        Returns:
            A ScheduleResult object.
        """
        remaining = self._get_task_remaining_minutes(task)
        task_start = self._aware(task.start_time)
        deadline = self._aware(task.deadline)
        segments: list[tuple[datetime, datetime]] = []
        if remaining <= 0:
            return self._empty_success(task)
        min_block = getattr(task, "min_split_minutes", self.min_block_minutes)
        max_block = getattr(task, "max_split_minutes", None)
        search_start = self._task_search_start(task_start, start_date)
        for current_date in self._iter_search_dates(search_start, deadline):
            if remaining <= 0 or not self._is_day_available(current_date):
                continue
            day_segments, day_remaining = self._schedule_split_day(
                task,
                current_date,
                task_start,
                deadline,
                segments,
                remaining,
                min_block,
                max_block,
            )
            if not day_segments or self._has_invalid_split_remainder(
                day_remaining,
                min_block,
            ):
                continue
            segments.extend(day_segments)
            remaining = day_remaining
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

    def _schedule_split_day(
        self,
        task: Task,
        current_date: date,
        task_start: datetime,
        deadline: datetime,
        segments: list[tuple[datetime, datetime]],
        remaining: int,
        min_block: int,
        max_block: int | None,
    ) -> tuple[list[tuple[datetime, datetime]], int]:
        """Schedule segments for a single day as part of a split task.

        Args:
            task: The task to schedule.
            current_date: The date being processed.
            task_start: Task start boundary.
            deadline: Task deadline boundary.
            segments: Current list of scheduled segments.
            remaining: Minutes still required for the task.
            min_block: Minimum allow split duration.
            max_block: Maximum allow split duration.

        Returns:
            A tuple of (day_segments, remaining_minutes).
        """
        category_minutes = self._get_remaining_category_minutes(
            task,
            current_date,
            current_segments=segments,
        )
        if self._insufficient_category_minutes(category_minutes, min_block):
            return [], remaining
        slots = self._task_slots_for_date(
            task,
            current_date,
            min_block,
            task_start,
            deadline,
        )
        return self._split_segments_for_slots(
            task,
            slots,
            task_start,
            deadline,
            remaining,
            min_block,
            max_block,
            category_minutes,
        )

    @staticmethod
    def _insufficient_category_minutes(
        category_minutes: int | None,
        min_block: int,
    ) -> bool:
        """Check if category limit prevents scheduling even a minimum block.

        Args:
            category_minutes: Remaining allowed category minutes.
            min_block: Minimum required minutes for a block.

        Returns:
            True if invalid, False otherwise.
        """
        return category_minutes is not None and category_minutes < min_block

    @staticmethod
    def _has_invalid_split_remainder(day_remaining: int, min_block: int) -> bool:
        """Check if the remaining time for a task is too small to schedule separately.

        Args:
            day_remaining: Remaining minutes needed for task.
            min_block: Minimum allowed split duration.

        Returns:
            True if remainder is invalid, False otherwise.
        """
        return 0 < day_remaining < min_block

    def _split_segments_for_slots(
        self,
        task: Task,
        slots: list[tuple[datetime, datetime]],
        task_start: datetime,
        deadline: datetime,
        remaining: int,
        min_block: int,
        max_block: int | None,
        category_minutes: int | None,
    ) -> tuple[list[tuple[datetime, datetime]], int]:
        """Iterate over available slots and split them for task allocation.

        Args:
            task: The task being scheduled.
            slots: Available time slots.
            task_start: Task start boundary.
            deadline: Task deadline boundary.
            remaining: Total minutes remaining to schedule.
            min_block: Minimum block duration.
            max_block: Maximum block duration.
            category_minutes: Daily category limit.

        Returns:
            A tuple of (newly_scheduled_segments, total_remaining_minutes).
        """
        day_remaining = remaining
        day_segments: list[tuple[datetime, datetime]] = []
        for slot in slots:
            candidate = self._clip_slot(
                self._task_slot(task, slot), task_start, deadline
            )
            if not candidate:
                continue
            next_segments, day_remaining, category_minutes = self._split_slot(
                task,
                candidate,
                day_remaining,
                min_block,
                max_block,
                category_minutes,
            )
            day_segments.extend(next_segments)
            if day_remaining <= 0:
                break
        return day_segments, day_remaining

    def _split_slot(
        self,
        task: Task,
        slot: tuple[datetime, datetime],
        remaining: int,
        min_block: int,
        max_block: int | None,
        category_minutes: int | None,
    ) -> tuple[list[tuple[datetime, datetime]], int, int | None]:
        """Split a single available slot into usable task segments.

        Args:
            task: The task being scheduled.
            slot: The available time slot.
            remaining: Minutes still needed for the task.
            min_block: Minimum block duration.
            max_block: Maximum block duration.
            category_minutes: Daily category limit.

        Returns:
            A tuple of (segments, updated_remaining, updated_category_minutes).
        """
        segments: list[tuple[datetime, datetime]] = []
        buffer_gap = sum(self._get_task_buffer_minutes(task))
        cursor, end = slot
        while remaining > 0 and cursor < end:
            if self._insufficient_category_minutes(category_minutes, min_block):
                return segments, remaining, category_minutes
            chunk = self._next_chunk_minutes(
                cursor,
                end,
                remaining,
                min_block,
                max_block,
                category_minutes,
            )
            if chunk is None:
                return segments, remaining, category_minutes
            next_end = cursor + timedelta(minutes=chunk)
            segments.append((cursor, next_end))
            remaining -= chunk
            if category_minutes is not None:
                category_minutes -= chunk
            cursor = next_end + timedelta(minutes=buffer_gap)
        return segments, remaining, category_minutes

    @staticmethod
    def _next_chunk_minutes(
        start: datetime,
        end: datetime,
        remaining: int,
        min_block: int,
        max_block: int | None,
        category_minutes: int | None,
    ) -> int | None:
        """Calculate the duration of the next task segment.

        Args:
            start: Segment start time.
            end: Candidate segment end time.
            remaining: Minutes needed for the task.
            min_block: Minimum block duration.
            max_block: Maximum block duration.
            category_minutes: Remaining category limit.

        Returns:
            Duration in minutes, or None if no valid chunk can be formed.
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

    def schedule_tasks(self, start_date: date) -> list[ScheduleResult]:
        """Iteratively schedule all tasks for the user.

        Args:
            start_date: The date to begin scheduling from.

        Returns:
            A list of ScheduleResult objects for each task.
        """
        results: list[ScheduleResult] = []
        for task in self._sorted_tasks():
            result = self._schedule_task(task, start_date)
            results.append(result)
            self._store_result(task, result)
        return results

    def _sorted_tasks(self) -> list[Task]:
        """Get the user's tasks sorted by importance and deadline.

        Returns:
            A sorted list of Task objects.
        """
        return sorted(self.tasks, key=lambda task: (-task.importance, task.deadline))

    def _schedule_task(self, task: Task, start_date: date) -> ScheduleResult:
        """Execute scheduling for an individual task.

        Args:
            task: The task to schedule.
            start_date: The starting date for search.

        Returns:
            A ScheduleResult object.
        """
        deadline = self._aware(task.deadline)
        if deadline.date() < start_date:
            return ScheduleResult(
                task_id=task.id,  # type: ignore[arg-type]
                success=False,
                reason="Deadline already passed",
            )
        if self.allow_split and task.allow_split:
            return self._schedule_task_split(task, start_date)
        return self._schedule_task_no_split(task, start_date)

    def _store_result(self, task: Task, result: ScheduleResult) -> None:
        """Save a task's scheduling result to internal state.

        Args:
            task: The task that was scheduled.
            result: The result of the scheduling process.
        """
        if not self._should_store_result(result):
            return
        segments = result.segments or [
            (result.scheduled_start, result.scheduled_end)  # type: ignore[list-item]
        ]
        self._scheduled_blocks.extend(
            self._expand_task_segment(task, start, end) for start, end in segments
        )
        self._scheduled_task_segments.extend(
            (task, start, end) for start, end in segments
        )

    @staticmethod
    def _should_store_result(result: ScheduleResult) -> bool:
        """Determine if a scheduling result should be saved.

        Args:
            result: The result to check.

        Returns:
            True if the result represents a successful allocation, False otherwise.
        """
        return (
            result.success
            and result.scheduled_start is not None
            and result.scheduled_end is not None
        )
