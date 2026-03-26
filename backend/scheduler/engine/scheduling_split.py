from __future__ import annotations

from datetime import date, datetime, timedelta

from core.models import Task
from scheduler.intervals import minutes_between
from scheduler.scheduler_types import ScheduleResult

DateTimeRange = tuple[datetime, datetime]
SplitLimits = tuple[int, int | None]


class _SchedulerSplitSchedulingMixin:
    def _split_task_limits(self, task: Task) -> SplitLimits:
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
        return self._task_slots_for_date(
            task, current_date, min_block, task_start, deadline
        )

    @staticmethod
    def _insufficient_category_minutes(
        category_minutes: int | None, min_block: int
    ) -> bool:
        return category_minutes is not None and category_minutes < min_block

    @staticmethod
    def _has_invalid_split_remainder(day_remaining: int, min_block: int) -> bool:
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
        return self._clip_slot(self._task_slot(task, slot), task_start, deadline)

    def _split_slot(
        self,
        task: Task,
        slot: DateTimeRange,
        remaining: int,
        limits: SplitLimits,
        category_minutes: int | None,
    ) -> tuple[list[DateTimeRange], int, int | None]:
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
