from __future__ import annotations

from datetime import date, datetime, time, timedelta

from django.db.models import Q
from django.utils import timezone

from core.models import Commute, Event, Preference, SpecialDates, Task
from core.services import expand_user_events


class SchedulerDataMixin:

    """Mixin providing data retrieval and utility methods for the scheduler."""

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
        """
        Initialise the scheduler data mixin.

        Args:
            user (User): The user for whom tasks are being scheduled.
            max_days_ahead (int): How far into the future the scheduler can plan.
            allow_split (bool): Whether tasks can be split across multiple sessions.
            min_block_minutes (int): The minimum duration for any single task block.
            task_ids (list[int] | None): IDs of specific tasks to limit the schedule to.
            include_locked_task_ids (list[int] | None): IDs of locked tasks that should still be considered.
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
        """
        Retrieve the user's scheduling preferences.

        Returns:
            Preference | None: The user's preference model instance, or None.
        """
        try:
            return self.user.preference  # type: ignore[attr-defined]

        except Preference.DoesNotExist:  # type: ignore[attr-defined]
            return None

    def _get_unscheduled_tasks(self) -> list[Task]:
        """
        Retrieve uncompleted tasks that haven't been allocated yet.

        Returns:
            list[Task]: A list of unscheduled Task instances.
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
        """
        Retrieve tasks that have already been allocated.

        Returns:
            list[Task]: A list of scheduled Task instances.
        """
        queryset = Task.objects.filter(user=self.user, completed=False)

        queryset = queryset.exclude(allocation=[]).order_by("start_time")
        return list(queryset)

    @staticmethod
    def _get_task_remaining_minutes(task: Task) -> int:
        """
        Calculate remaining minutes for a task.

        Args:
            task (Task): The task instance.

        Returns:
            int: The number of minutes left to complete the task.
        """
        estimated = int(getattr(task, "estimated_minutes", 0) or 0)

        completed = int(getattr(task, "completed_minutes", 0) or 0)
        return max(0, estimated - completed)

    def _get_events(self) -> list[Event]:
        """
        Retrieve all calendar events for the user.

        Returns:
            list[Event]: A list of user events.
        """
        return list(Event.objects.filter(user=self.user).order_by("start_time"))


    def _get_commutes(self) -> list[Commute]:
        """
        Retrieve all commute settings for the user.

        Returns:
            list[Commute]: A list of user commutes.
        """
        return list(Commute.objects.filter(user=self.user))


    def _get_special_dates(self):
        """
        Retrieve dates marked as unavailable.

        Returns:
            set[date]: A set of dates from the SpecialDates model.
        """
        queryset = SpecialDates.objects.filter(user=self.user)

        return set(queryset.values_list("date", flat=True))

    @staticmethod
    def _aware(dt: datetime) -> datetime:
        """
        Ensure a datetime object is timezone-aware.

        Args:
            dt (datetime): The datetime object.

        Returns:
            datetime: The aware datetime object.
        """
        if timezone.is_naive(dt):

            return timezone.make_aware(dt)
        return dt

    @staticmethod
    def _ceil_to_minute(dt: datetime) -> datetime:
        """
        Round a datetime up to the next full minute.

        Args:
            dt (datetime): The datetime object.

        Returns:
            datetime: The ceiled datetime object.
        """
        if dt.second == 0 and dt.microsecond == 0:

            return dt
        return dt.replace(second=0, microsecond=0) + timedelta(minutes=1)

    @staticmethod
    def _get_task_buffer_minutes(task: Task) -> tuple[int, int]:
        """
        Retrieve before and after buffer minutes for a task.

        Args:
            task (Task): The task instance.

        Returns:
            tuple[int, int]: A tuple of (buffer_before, buffer_after) in minutes.
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
        """
        Expand a task session interval with its pre and post buffers.

        Args:
            task (Task): The task instance.
            start (datetime): The session start time.
            end (datetime): The session end time.

        Returns:
            tuple[datetime, datetime]: A tuple of expanded start and end datetimes.
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
        """
        Reduce an available slot to accommodate task buffers.

        Args:
            task (Task): The task instance.
            slot (tuple[datetime, datetime]): The original available time slot.

        Returns:
            tuple[datetime, datetime] | None: The shrunk slot or None if buffers consume it.
        """
        start, end = slot

        buffer_before, buffer_after = self._get_task_buffer_minutes(task)
        actual_start = start + timedelta(minutes=buffer_before)
        actual_end = end - timedelta(minutes=buffer_after)
        if actual_end <= actual_start:
            return None
        return actual_start, actual_end

    def _is_day_available(self, target_date: date) -> bool:
        """
        Determine if the user is available for scheduling on a given date.

        Args:
            target_date (date): The date to check.

        Returns:
            bool: True if the day is not a day off or special date.
        """
        if self.preference:

            days_off = set(
                self.preference.days_off.values_list("day", flat=True)  # type: ignore[attr-defined]
            )
            if target_date.weekday() + 1 in days_off:
                return False
        return target_date not in self.special_dates

    def _working_window(self, target_date: date) -> tuple[datetime, datetime]:
        """
        Get the defined working hours for a date from user preferences.

        Args:
            target_date (date): The date to calculate for.

        Returns:
            tuple[datetime, datetime]: Start and end datetimes of the working window.
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
        """
        Return the full 24-hour window for a date.

        Args:
            target_date (date): The date to calculate for.

        Returns:
            tuple[datetime, datetime]: A tuple of midnight to the end of the day.
        """
        start = self._aware(datetime.combine(target_date, time.min))

        end = self._aware(datetime.combine(target_date, time.max))
        return start, end

    def _get_expanded_event_slots(
        self,
        target_date: date,
    ) -> list[tuple[datetime, datetime]]:
        """
        Get all expanded event instances for a specific date.

        Args:
            target_date (date): The date to expand events for.

        Returns:
            list[tuple[datetime, datetime]]: A list of all occurrence time slots.
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
        """
        Calculate search boundaries for a task and date.

        Args:
            task_start (datetime): Earliest allowed start time.
            deadline (datetime): Absolute deadline.
            current_date (date): The date currently being searched.

        Returns:
            tuple[datetime | None, datetime | None]: A tuple of (not_before, not_after) boundaries.
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
        """
        Find available slots for a task on a specific date.

        Args:
            task (Task): The task being scheduled.
            current_date (date): The date to search.
            min_minutes (int): Minimum required free time.
            task_start (datetime): Earliest allowed task start.
            deadline (datetime): Task deadline.

        Returns:
            list[tuple[datetime, datetime]]: A list of available time slots.
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
        """
        Generate a list of dates to search for task slots.

        Args:
            start_date (date): Initial date to start the search.
            deadline (datetime): The deadline which search cannot exceed.

        Returns:
            list[date]: A list of dates within the horizon and before the deadline.
        """
        dates: list[date] = []

        for offset in range(self.max_days_ahead + 1):
            current_date = start_date + timedelta(days=offset)
            if current_date > deadline.date():
                return dates
            dates.append(current_date)
        return dates
