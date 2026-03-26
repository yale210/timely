"""Mixin for availability calculations in the scheduler engine."""

from __future__ import annotations

from datetime import date, datetime

from django.utils import timezone

from scheduler.intervals import (
    clamp_slots,
    filter_slots_by_minutes,
    overlap_minutes,
    subtract_intervals,
    trim_slots_to_minutes,
)


class SchedulerAvailabilityMixin:
    """Mixin providing availability calculations for the scheduler.

    This mixin includes methods to calculate occupied and free time slots
    based on events, tasks, and user preferences.
    """

    def _get_occupied_slots(self, target_date: date) -> list[tuple[datetime, datetime]]:
        """Retrieve all occupied time slots for a given date.

        Args:
            target_date: The date for which to find occupied slots.

        Returns:
            A list of tuples representing occupied time ranges.
        """
        occupied: list[tuple[datetime, datetime]] = []
        day_start, day_end = self._day_window(target_date)
        occupied.extend(self._event_slots(target_date, day_start, day_end))
        occupied.extend(self._scheduled_task_slots(day_start, day_end))
        occupied.extend(self._scheduled_block_slots(day_start, day_end))
        occupied.extend(self._commute_slots(target_date))
        return occupied

    def _event_slots(
        self,
        target_date: date,
        day_start: datetime,
        day_end: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """Calculate event-based occupied slots for a given day.

        Args:
            target_date: The date to process.
            day_start: Start of the day window.
            day_end: End of the day window.

        Returns:
            A list of event time slots.
        """
        return [
            (start, end)
            for start, end in self._get_expanded_event_slots(target_date)
            if start < day_end and end > day_start
        ]

    def _scheduled_task_slots(
        self,
        day_start: datetime,
        day_end: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """Calculate occupied slots from already scheduled tasks.

        Args:
            day_start: Start of the day window.
            day_end: End of the day window.

        Returns:
            A list of task-based occupied slots.
        """
        occupied: list[tuple[datetime, datetime]] = []
        for task in self.scheduled_tasks:
            occupied.extend(
                self._expanded_scheduled_task_slots(task, day_start, day_end)
            )
        return occupied

    def _expanded_scheduled_task_slots(
        self,
        task,
        day_start: datetime,
        day_end: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """Calculate expanded occupied slots for a task including its buffers.

        This method retrieves the raw allocation segments for a task and expands
        each one by applying the user's preferred buffer times (before/after).
        This ensures that scheduling new tasks respects the necessary transitions
        between activities.

        Args:
            task: The Task object whose allocated segments are being expanded.
            day_start: The start of the temporal window for filtering segments.
            day_end: The end of the temporal window for filtering segments.

        Returns:
            A list of datetime tuples representing the expanded time slots that
            the task effectively occupies on this day.
        """
        overlapping = [
            (start, end)
            for start, end in self._task_allocation_segments(task)
            if start < day_end and end > day_start
        ]
        return [
            self._expand_task_segment(task, start, end) for start, end in overlapping
        ]

    def _scheduled_block_slots(
        self,
        day_start: datetime,
        day_end: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """Calculate occupied slots from explicitly scheduled blocks.

        Args:
            day_start: Start of the day window.
            day_end: End of the day window.

        Returns:
            A list of block-based occupied slots.
        """
        return [
            (start, end)
            for start, end in self._scheduled_blocks
            if start < day_end and end > day_start
        ]

    def _commute_slots(self, target_date: date) -> list[tuple[datetime, datetime]]:
        """Calculate occupied slots from commutes for a given date.

        Args:
            target_date: The date to process.

        Returns:
            A list of commute-based occupied slots.
        """
        occupied: list[tuple[datetime, datetime]] = []
        for commute in self.commutes:
            if not self._commute_applies(commute, target_date):
                continue
            start = self._aware(datetime.combine(target_date, commute.commute_start))
            end = self._aware(datetime.combine(target_date, commute.commute_end))
            occupied.append((start, end))
        return occupied

    @staticmethod
    def _commute_applies(commute, target_date: date) -> bool:
        """Determine if a commute applies to a given date.

        Args:
            commute: The commute object to check.
            target_date: The date to check against.

        Returns:
            True if the commute applies, False otherwise.
        """
        day_attr = getattr(commute, "day_of_week", None)
        if not day_attr or not hasattr(day_attr, "all"):
            return True
        commute_days = [day.day for day in day_attr.all()]
        return (target_date.weekday() + 1) in commute_days

    def get_available_slots(
        self,
        target_date: date,
        min_minutes: int,
        *,
        not_before: datetime | None = None,
        not_after: datetime | None = None,
    ) -> list[tuple[datetime, datetime]]:
        """Calculate available time slots for task scheduling.

        Args:
            target_date: The date for which to find available slots.
            min_minutes: The minimum required duration for a slot.
            not_before: Optional boundary for start time.
            not_after: Optional boundary for end time.

        Returns:
            A list of available time slots.
        """
        window = self._working_window(target_date)
        occupied = self._get_occupied_slots(target_date)
        free_slots = subtract_intervals(window, occupied)
        free_slots = self._trim_past_slots(
            target_date,
            window,
            occupied,
            free_slots,
            not_before,
        )
        free_slots = clamp_slots(
            free_slots,
            not_before=not_before,
            not_after=not_after,
        )
        free_slots = self._apply_daily_capacity(window, free_slots)
        return filter_slots_by_minutes(free_slots, min_minutes)

    def _trim_past_slots(
        self,
        target_date: date,
        window: tuple[datetime, datetime],
        occupied: list[tuple[datetime, datetime]],
        free_slots: list[tuple[datetime, datetime]],
        not_before: datetime | None,
    ) -> list[tuple[datetime, datetime]]:
        """Remove available slots that are in the past.

        Args:
            target_date: The date being processed.
            window: The working window for the day.
            occupied: List of occupied slots.
            free_slots: Current list of free slots.
            not_before: Optional boundary for start time.

        Returns:
            A list of free slots starting from the current time or after.
        """
        if target_date != timezone.localdate():
            return free_slots
        now = timezone.now()
        if now <= window[0]:
            return free_slots
        effective_start = self._ceil_to_minute(now)
        if not_before is not None:
            effective_start = max(effective_start, not_before)
        return subtract_intervals((effective_start, window[1]), occupied)

    def _apply_daily_capacity(
        self,
        window: tuple[datetime, datetime],
        free_slots: list[tuple[datetime, datetime]],
    ) -> list[tuple[datetime, datetime]]:
        """Limit available slots according to the user's daily study hours.

        Args:
            window: The day window being processed.
            free_slots: Current list of free slots.

        Returns:
            A list of free slots limited by daily capacity.
        """
        if not self.preference:
            return free_slots
        if not getattr(self.preference, "limit_max_hours", True):
            return free_slots
        max_minutes = int(self.preference.max_hours_study_per_day) * 60
        scheduled_minutes = self._scheduled_minutes_in_window(window)
        remaining_minutes = max(0, max_minutes - scheduled_minutes)
        if remaining_minutes == 0:
            return []
        return trim_slots_to_minutes(free_slots, remaining_minutes)

    def _scheduled_minutes_in_window(
        self,
        window: tuple[datetime, datetime],
    ) -> int:
        """Calculate the total scheduled minutes within a time window.

        Args:
            window: The time window to check.

        Returns:
            The total number of scheduled minutes.
        """
        scheduled_minutes = 0
        for task in self.scheduled_tasks:
            for start, end in self._task_allocation_segments(task):
                scheduled_minutes += overlap_minutes(start, end, *window)
        for _, start, end in self._scheduled_task_segments:
            scheduled_minutes += overlap_minutes(start, end, *window)
        return scheduled_minutes
