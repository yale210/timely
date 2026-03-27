"""Mixin for data retrieval and state management in the scheduler engine."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta

from django.db.models import Q
from django.utils import timezone

from core.models import Commute, Event, Preference, SpecialDates, Task
from core.services import expand_user_events


class SchedulerDataMixin:
    """Mixin for managing data and state within the scheduler engine.

    This class handles the initialization of scheduler state, including
    retrieving tasks, events, commutes, and user preferences from the database.
    """

    def __init__(
        self,
        user,
        *,
        max_days_ahead: int = 7,
        allow_split: bool = False,
        min_block_minutes: int = 30,
        task_ids: list[int] | None = None,
        include_locked_task_ids: list[int] | None = None,
    ):
        """Initialise the scheduler data mixin.

        Args:
            user: The user for whom tasks are being scheduled.
            max_days_ahead: The maximum number of days to look ahead for scheduling.
            allow_split: Whether to allow tasks to be split into multiple segments.
            min_block_minutes: Minimum duration for a single scheduled block.
            task_ids: Optional list of specific task IDs to schedule.
            include_locked_task_ids: Optional list of locked task IDs to include.
        """
        self.user = user
        self.max_days_ahead = max_days_ahead
        self.allow_split = allow_split
        self.min_block_minutes = min_block_minutes
        self.task_ids = set(task_ids or [])
        self.include_locked_task_ids = set(include_locked_task_ids or [])
        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.scheduled_tasks = self._get_scheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()
        self.special_dates = self._get_special_dates()
        self._scheduled_blocks: list[tuple[datetime, datetime]] = []
        self._scheduled_task_segments: list[tuple[Task, datetime, datetime]] = []
        self._expanded_events_by_date: dict[date, list[tuple[datetime, datetime]]] = {}

    def _get_preference(self):
        """Retrieve the user's scheduling preferences.

        Returns:
            The Preference object for the user, or None if it does not exist.
        """
        try:
            return self.user.preference  # type: ignore[attr-defined]
        except Preference.DoesNotExist:  # type: ignore[attr-defined]
            return None

    def _get_unscheduled_tasks(self) -> list[Task]:
        """Retrieve the list of tasks to be scheduled.

        Returns:
            A list of Task objects sorted by importance and deadline.
        """
        queryset = Task.objects.filter(
            user=self.user,
            completed=False,
            allocation=[],
        )
        if self.include_locked_task_ids:
            queryset = queryset.filter(
                Q(locked=False) | Q(id__in=self.include_locked_task_ids)
            )
        else:
            queryset = queryset.filter(locked=False)
        if self.task_ids:
            queryset = queryset.filter(id__in=self.task_ids)
        return list(queryset.order_by("-importance", "deadline"))

    def _get_scheduled_tasks(self) -> list[Task]:
        """Retrieve the list of already scheduled tasks.

        Returns:
            A list of Task objects that have an allocation.
        """
        queryset = Task.objects.filter(user=self.user, completed=False)
        queryset = queryset.exclude(allocation=[]).order_by("start_time")
        return list(queryset)

    @staticmethod
    def _get_task_remaining_minutes(task: Task) -> int:
        """Calculate the remaining minutes required for a task.

        Args:
            task: The task to calculate for.

        Returns:
            The number of minutes remaining.
        """
        estimated = int(getattr(task, "estimated_minutes", 0) or 0)
        completed = int(getattr(task, "completed_minutes", 0) or 0)
        return max(0, estimated - completed)

    def _get_events(self) -> list[Event]:
        """Retrieve the list of events for the user.

        Returns:
            A list of Event objects sorted by start time.
        """
        return list(Event.objects.filter(user=self.user).order_by("start_time"))

    def _get_commutes(self) -> list[Commute]:
        """Retrieve the list of commutes for the user.

        Returns:
            A list of Commute objects.
        """
        return list(Commute.objects.filter(user=self.user))

    def _get_special_dates(self):
        """Retrieve the set of special dates (e.g., holidays) for the user.

        Returns:
            A set of date objects.
        """
        queryset = SpecialDates.objects.filter(user=self.user)
        return set(queryset.values_list("date", flat=True))

    @staticmethod
    def _aware(dt: datetime) -> datetime:
        """Ensure a datetime object is timezone-aware.

        Args:
            dt: The datetime object to check.

        Returns:
            A timezone-aware datetime object.
        """
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    @staticmethod
    def _ceil_to_minute(dt: datetime) -> datetime:
        """Round a datetime object up to the nearest minute.

        Args:
            dt: The datetime object to round.

        Returns:
            The rounded datetime object.
        """
        if dt.second == 0 and dt.microsecond == 0:
            return dt
        return dt.replace(second=0, microsecond=0) + timedelta(minutes=1)

    @staticmethod
    def _get_task_buffer_minutes(task: Task) -> tuple[int, int]:
        """Retrieve the buffer times (before and after) for a task.

        Args:
            task: The task to check.

        Returns:
            A tuple of (buffer_before, buffer_after) in minutes.
        """
        return (
            int(getattr(task, "buffer_before_minutes", 0) or 0),
            int(getattr(task, "buffer_after_minutes", 0) or 0),
        )

    def _expand_task_segment(
        self,
        task: Task,
        start: datetime,
        end: datetime,
    ) -> tuple[datetime, datetime]:
        """Expand a task time segment by its buffer times.

        Args:
            task: The task whose buffers should be applied.
            start: The start time of the segment.
            end: The end time of the segment.

        Returns:
            A tuple representing the expanded time range.
        """
        buffer_before, buffer_after = self._get_task_buffer_minutes(task)
        return (
            start - timedelta(minutes=buffer_before),
            end + timedelta(minutes=buffer_after),
        )

    def _shrink_slot_for_task(
        self,
        task: Task,
        slot: tuple[datetime, datetime],
    ) -> tuple[datetime, datetime] | None:
        """Shrink an available time slot to accommodate a task's buffers.

        Args:
            task: The task with buffer requirements.
            slot: The available time slot.

        Returns:
            The shrunk time slot, or None if the buffers exceed the slot duration.
        """
        start, end = slot
        buffer_before, buffer_after = self._get_task_buffer_minutes(task)
        actual_start = start + timedelta(minutes=buffer_before)
        actual_end = end - timedelta(minutes=buffer_after)
        if actual_end <= actual_start:
            return None
        return actual_start, actual_end

    def _is_day_available(self, target_date: date) -> bool:
        """Check if a specific day is available for scheduling.

        Args:
            target_date: The date to check.

        Returns:
            True if the day is available, False if it is a day off or special date.
        """
        if self.preference:
            days_off = set(
                self.preference.days_off.values_list("day", flat=True)  # type: ignore[attr-defined]
            )
            if target_date.weekday() + 1 in days_off:
                return False
        return target_date not in self.special_dates

    def _working_window(self, target_date: date) -> tuple[datetime, datetime]:
        """Determine the working time window for a specific date.

        Args:
            target_date: The date to process.

        Returns:
            A tuple representing the start and end of the working window.
        """
        if self.preference:
            start_time, end_time = self.preference.get_day_window(target_date)  # type: ignore[attr-defined]
            day_start = self._aware(datetime.combine(target_date, start_time))
            day_end = self._aware(datetime.combine(target_date, end_time))
            if day_end <= day_start:
                day_end += timedelta(days=1)
            return day_start, day_end
        return self._day_window(target_date)

    def _day_window(self, target_date: date) -> tuple[datetime, datetime]:
        """Determine the full 24-hour window for a specific date.

        Args:
            target_date: The date to process.

        Returns:
            A tuple representing the start and end of the day.
        """
        start = self._aware(datetime.combine(target_date, time.min))
        end = self._aware(datetime.combine(target_date, time.max))
        return start, end

    def _get_expanded_event_slots(
        self,
        target_date: date,
    ) -> list[tuple[datetime, datetime]]:
        """Retrieve expanded event slots for a specific date.

        Args:
            target_date: The date to process.

        Returns:
            A list of tuples representing event time slots.
        """
        cached = self._expanded_events_by_date.get(target_date)
        if cached is not None:
            return cached
        day_start, day_end = self._day_window(target_date)
        instances = expand_user_events(self.user, day_start, day_end)
        slots = [(instance.start_time, instance.end_time) for instance in instances]
        self._expanded_events_by_date[target_date] = slots
        return slots

    def _task_date_bounds(
        self,
        task_start: datetime,
        deadline: datetime,
        current_date: date,
    ) -> tuple[datetime | None, datetime | None]:
        """Find the time boundaries for scheduling a task on a specific date.

        Args:
            task_start: The earliest possible start time for the task.
            deadline: The task's deadline.
            current_date: The date being processed.

        Returns:
            A tuple of (not_before, not_after) boundaries.
        """
        not_before = task_start if current_date == task_start.date() else None
        not_after = deadline if current_date == deadline.date() else None
        return not_before, not_after

    def _task_slots_for_date(
        self,
        task: Task,
        current_date: date,
        min_minutes: int,
        task_start: datetime,
        deadline: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """Retrieve available time slots for a task on a specific date.

        Args:
            task: The task to be scheduled.
            current_date: The date to check.
            min_minutes: Minimum minutes required for a slot.
            task_start: The task's earliest start time.
            deadline: The task's deadline.

        Returns:
            A list of available time slots.
        """
        not_before, not_after = self._task_date_bounds(
            task_start,
            deadline,
            current_date,
        )
        return self.get_available_slots(
            current_date,
            min_minutes,
            not_before=not_before,
            not_after=not_after,
        )

    def _iter_search_dates(self, start_date: date, deadline: datetime) -> list[date]:
        """Generate a list of dates to search for available scheduling slots.

        Args:
            start_date: The date to start searching from.
            deadline: The deadline by which the task must be scheduled.

        Returns:
            A list of dates within the search range.
        """
        dates: list[date] = []
        for offset in range(self.max_days_ahead + 1):
            current_date = start_date + timedelta(days=offset)
            if current_date > deadline.date():
                return dates
            dates.append(current_date)
        return dates
