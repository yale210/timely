from __future__ import annotations

from datetime import date, datetime

from scheduler.intervals import overlap_minutes


class SchedulerCategoryMixin:
    """Mixin providing category-related quota calculations for the scheduler."""

    def _get_remaining_category_minutes(
        self,
        task,
        target_date: date,
        current_segments: list[tuple[datetime, datetime]] | None = None,
    ) -> int | None:
        """
        Calculate available category minutes for a task on a given date.

        Args:
            task (Task): The task instance to check.
            target_date (date): The date to calculate for.
            current_segments (list[tuple[datetime, datetime]] | None): Optional list of segments already added in this session.

        Returns:
            int | None: The minimum remaining minutes across all categories of the task, or None if no limits.
        """
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
        """
        Retrieve daily study time limits for all categories.

        Args:
            task (Task): The task instance.

        Returns:
            dict[int, int]: A dictionary mapping category IDs to their maximum daily study time in minutes.
        """
        limits: dict[int, int] = {}

        for category in task.categories.all():
            if category.id is None or category.max_daily_study_time is None:
                continue
            limits[category.id] = int(category.max_daily_study_time)
        return limits

    def _task_category_ids(self, task) -> set[int]:
        """
        Get all category IDs assigned to a task.

        Args:
            task (Task): The task instance.

        Returns:
            set[int]: A set of category IDs.
        """
        return set(task.categories.values_list("id", flat=True))

    def _task_allocation_segments(self, task) -> list[tuple[datetime, datetime]]:
        """
        Parse task allocation JSON into datetime tuples.

        Args:
            task (Task): The task instance with allocation data.

        Returns:
            list[tuple[datetime, datetime]]: A list of start and end datetime tuples.
        """
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
        """
        Calculate and add overlap minutes to relevant categories.

        Args:
            minutes_used (dict[int, int]): Running total of minutes used per category.
            category_ids (set[int]): Categories to which the interval belongs.
            start (datetime): Start of the time interval.
            end (datetime): End of the time interval.
            window (tuple[datetime, datetime]): The time window for calculation.

        Returns:
            None: This method modifies the dictionary in place.
        """
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
        """
        Calculate total minutes used per category for a date.

        Args:
            task (Task): The task whose categories are checked.
            target_date (date): The date to check.
            category_limits (dict[int, int]): Category IDs to calculate for.
            current_segments (list[tuple[datetime, datetime]]): New segments.

        Returns:
            dict[int, int]: A dictionary mapping category IDs to total minutes.
        """
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
