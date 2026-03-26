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
    """Mixin providing availability-related calculations for the scheduler."""

    def _get_occupied_slots(self, target_date: date) -> list[tuple[datetime, datetime]]:
        """
        Get all occupied time slots for a specific date.

        Args:
            target_date (date): The date to check for occupied slots.

        Returns:
            list[tuple[datetime, datetime]]: A list of start and end datetime tuples representing occupied periods.
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
        """
        Get time slots occupied by calendar events.

        Args:
            target_date (date): The date to check.
            day_start (datetime): The start of the day window.
            day_end (datetime): The end of the day window.

        Returns:
            list[tuple[datetime, datetime]]: A list of event time slots within the day window.
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
        """
        Get time slots occupied by already scheduled tasks.

        Args:
            day_start (datetime): The start of the day window.
            day_end (datetime): The end of the day window.

        Returns:
            list[tuple[datetime, datetime]]: A list of time slots occupied by other tasks, including buffers.
        """
        occupied: list[tuple[datetime, datetime]] = []

        for task in self.scheduled_tasks:
            for start, end in self._task_allocation_segments(task):
                if start < day_end and end > day_start:
                    occupied.append(self._expand_task_segment(task, start, end))
        return occupied

    def _scheduled_block_slots(
        self,
        day_start: datetime,
        day_end: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """
        Get time slots occupied by blocks scheduled in the current session.

        Args:
            day_start (datetime): The start of the day window.
            day_end (datetime): The end of the day window.

        Returns:
            list[tuple[datetime, datetime]]: A list of newly scheduled block segments within the day window.
        """
        return [
            (start, end)
            for start, end in self._scheduled_blocks
            if start < day_end and end > day_start
        ]

    def _commute_slots(self, target_date: date) -> list[tuple[datetime, datetime]]:
        """
        Get time slots occupied by user commutes.

        Args:
            target_date (date): The date to check for commutes.

        Returns:
            list[tuple[datetime, datetime]]: A list of commute time slots for the given date.
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
        """
        Check if a recurring commute applies to a specific date.

        Args:
            commute (Commute): The commute model instance.
            target_date (date): The date to check against.

        Returns:
            bool: True if the commute applies to the date, False otherwise.
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
        """
        Calculate free time slots for a given date.

        Args:
            target_date (date): The date to search for availability.
            min_minutes (int): The minimum duration for a slot to be considered.
            not_before (datetime | None): Optional lower bound for slots.
            not_after (datetime | None): Optional upper bound for slots.

        Returns:
            list[tuple[datetime, datetime]]: A list of available start and end datetime tuples.
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
        """
        Remove time slots that have already passed if checking today.

        Args:
            target_date (date): The date being checked.
            window (tuple[datetime, datetime]): The working window for the day.
            occupied (list[tuple[datetime, datetime]]): List of occupied slots.
            free_slots (list[tuple[datetime, datetime]]): Current list of free slots.
            not_before (datetime | None): Optional start boundary.

        Returns:
            list[tuple[datetime, datetime]]: A list of free slots starting from the current time or specified boundary.
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
        """
        Restrict free slots based on the user's daily study hour limit.

        Args:
            window (tuple[datetime, datetime]): The day's time window.
            free_slots (list[tuple[datetime, datetime]]): Current list of free slots.

        Returns:
            list[tuple[datetime, datetime]]: A list of slots truncated to stay within daily hourly capacity.
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
        """
        Calculate total minutes already scheduled within a time window.

        Args:
            window (tuple[datetime, datetime]): The time window to calculate for.

        Returns:
            int: Total number of scheduled minutes.
        """
        scheduled_minutes = 0

        for task in self.scheduled_tasks:
            for start, end in self._task_allocation_segments(task):
                scheduled_minutes += overlap_minutes(start, end, *window)
        for _, start, end in self._scheduled_task_segments:
            scheduled_minutes += overlap_minutes(start, end, *window)
        return scheduled_minutes
