from __future__ import annotations

from datetime import date, datetime, timedelta

from core.models import Task
from scheduler.intervals import minutes_between
from scheduler.scheduler_types import ScheduleResult


class SchedulerSchedulingMixin:
    def _clip_to_deadline(
        self,
        slot: tuple[datetime, datetime],
        deadline: datetime,
    ) -> tuple[datetime, datetime] | None:
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
        start, end = slot
        if end <= task_start:
            return None
        if start < task_start:
            return task_start, end
        return slot

    def _empty_success(self, task: Task) -> ScheduleResult:
        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=True,
            scheduled_start=None,
            scheduled_end=None,
            segments=[],
        )

    @staticmethod
    def _task_search_start(task_start: datetime, start_date: date) -> date:
        return max(start_date, task_start.date())

    def _task_slot(
        self,
        task: Task,
        slot: tuple[datetime, datetime],
    ) -> tuple[datetime, datetime] | None:
        return self._shrink_slot_for_task(task, slot)

    def _clip_slot(
        self,
        slot: tuple[datetime, datetime] | None,
        task_start: datetime,
        deadline: datetime,
    ) -> tuple[datetime, datetime] | None:
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
        category_minutes = self._get_remaining_category_minutes(task, slot[0].date())
        if category_minutes is not None and remaining_minutes > category_minutes:
            return False
        return minutes_between(*slot) >= remaining_minutes

    def _schedule_task_no_split(self, task: Task, start_date: date) -> ScheduleResult:
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
        return category_minutes is not None and category_minutes < min_block

    @staticmethod
    def _has_invalid_split_remainder(day_remaining: int, min_block: int) -> bool:
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
        results: list[ScheduleResult] = []
        for task in self._sorted_tasks():
            result = self._schedule_task(task, start_date)
            results.append(result)
            self._store_result(task, result)
        return results

    def _sorted_tasks(self) -> list[Task]:
        return sorted(self.tasks, key=lambda task: (-task.importance, task.deadline))

    def _schedule_task(self, task: Task, start_date: date) -> ScheduleResult:
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
        return (
            result.success
            and result.scheduled_start is not None
            and result.scheduled_end is not None
        )
