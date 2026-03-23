from __future__ import annotations

from datetime import date, datetime

from scheduler.intervals import overlap_minutes


class SchedulerCategoryMixin:
    def _get_remaining_category_minutes(
        self,
        task,
        target_date: date,
        current_segments: list[tuple[datetime, datetime]] | None = None,
    ) -> int | None:
        category_limits = self._category_limits(task)
        if not category_limits:
            return None
        minutes_used = self._category_minutes_used(
            task,
            target_date,
            category_limits,
            current_segments or [],
        )
        remaining = [
            max(0, category_limits[category_id] - minutes_used[category_id])
            for category_id in category_limits
        ]
        return min(remaining)

    def _category_limits(self, task) -> dict[int, int]:
        limits: dict[int, int] = {}
        for category in task.categories.all():
            if category.id is None or category.max_daily_study_time is None:
                continue
            limits[category.id] = int(category.max_daily_study_time)
        return limits

    def _task_category_ids(self, task) -> set[int]:
        return set(task.categories.values_list("id", flat=True))

    def _task_allocation_segments(self, task) -> list[tuple[datetime, datetime]]:
        segments: list[tuple[datetime, datetime]] = []
        for slot in task.allocation or []:
            try:
                start = self._aware(datetime.fromisoformat(slot["start"]))
                end = self._aware(datetime.fromisoformat(slot["end"]))
            except (KeyError, ValueError, TypeError):
                continue
            segments.append((start, end))
        return segments

    def _add_category_overlap(
        self,
        minutes_used: dict[int, int],
        category_ids: set[int],
        start: datetime,
        end: datetime,
        window: tuple[datetime, datetime],
    ) -> None:
        overlap = overlap_minutes(start, end, *window)
        if overlap <= 0:
            return
        for category_id in category_ids & set(minutes_used):
            minutes_used[category_id] += overlap

    def _category_minutes_used(
        self,
        task,
        target_date: date,
        category_limits: dict[int, int],
        current_segments: list[tuple[datetime, datetime]],
    ) -> dict[int, int]:
        window = self._day_window(target_date)
        minutes_used = {category_id: 0 for category_id in category_limits}
        task_category_ids = self._task_category_ids(task)
        limited_ids = set(category_limits)
        for scheduled_task in self.scheduled_tasks:
            category_ids = self._task_category_ids(scheduled_task)
            if not category_ids & limited_ids:
                continue
            for start, end in self._task_allocation_segments(scheduled_task):
                self._add_category_overlap(
                    minutes_used,
                    category_ids,
                    start,
                    end,
                    window,
                )
        for scheduled_task, start, end in self._scheduled_task_segments:
            category_ids = self._task_category_ids(scheduled_task)
            self._add_category_overlap(minutes_used, category_ids, start, end, window)
        for start, end in current_segments:
            self._add_category_overlap(
                minutes_used,
                task_category_ids,
                start,
                end,
                window,
            )
        return minutes_used
