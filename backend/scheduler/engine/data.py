from __future__ import annotations

from datetime import date, datetime, time, timedelta

from django.db.models import Q
from django.utils import timezone

from core.models import Commute, Event, Preference, SpecialDates, Task
from core.services import expand_user_events


class SchedulerDataMixin:
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
        try:
            return self.user.preference  # type: ignore[attr-defined]
        except Preference.DoesNotExist:  # type: ignore[attr-defined]
            return None

    def _get_unscheduled_tasks(self) -> list[Task]:
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
        queryset = Task.objects.filter(user=self.user, completed=False)
        queryset = queryset.exclude(allocation=[]).order_by("start_time")
        return list(queryset)

    @staticmethod
    def _get_task_remaining_minutes(task: Task) -> int:
        estimated = int(getattr(task, "estimated_minutes", 0) or 0)
        completed = int(getattr(task, "completed_minutes", 0) or 0)
        return max(0, estimated - completed)

    def _get_events(self) -> list[Event]:
        return list(Event.objects.filter(user=self.user).order_by("start_time"))

    def _get_commutes(self) -> list[Commute]:
        return list(Commute.objects.filter(user=self.user))

    def _get_special_dates(self):
        queryset = SpecialDates.objects.filter(user=self.user)
        return set(queryset.values_list("date", flat=True))

    @staticmethod
    def _aware(dt: datetime) -> datetime:
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    @staticmethod
    def _ceil_to_minute(dt: datetime) -> datetime:
        if dt.second == 0 and dt.microsecond == 0:
            return dt
        return dt.replace(second=0, microsecond=0) + timedelta(minutes=1)

    @staticmethod
    def _get_task_buffer_minutes(task: Task) -> tuple[int, int]:
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
        start, end = slot
        buffer_before, buffer_after = self._get_task_buffer_minutes(task)
        actual_start = start + timedelta(minutes=buffer_before)
        actual_end = end - timedelta(minutes=buffer_after)
        if actual_end <= actual_start:
            return None
        return actual_start, actual_end

    def _is_day_available(self, target_date: date) -> bool:
        if self.preference:
            days_off = set(
                self.preference.days_off.values_list("day", flat=True)  # type: ignore[attr-defined]
            )
            if target_date.weekday() + 1 in days_off:
                return False
        return target_date not in self.special_dates

    def _working_window(self, target_date: date) -> tuple[datetime, datetime]:
        if self.preference:
            start_time, end_time = self.preference.get_day_window(target_date)  # type: ignore[attr-defined]
            day_start = self._aware(datetime.combine(target_date, start_time))
            day_end = self._aware(datetime.combine(target_date, end_time))
            if day_end <= day_start:
                day_end += timedelta(days=1)
            return day_start, day_end
        return self._day_window(target_date)

    def _day_window(self, target_date: date) -> tuple[datetime, datetime]:
        start = self._aware(datetime.combine(target_date, time.min))
        end = self._aware(datetime.combine(target_date, time.max))
        return start, end

    def _get_expanded_event_slots(
        self,
        target_date: date,
    ) -> list[tuple[datetime, datetime]]:
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
        dates: list[date] = []
        for offset in range(self.max_days_ahead + 1):
            current_date = start_date + timedelta(days=offset)
            if current_date > deadline.date():
                return dates
            dates.append(current_date)
        return dates
