"""Shared support for scheduler engine mixin tests."""

from datetime import date, datetime, time, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.utils.timezone import make_aware

from core.models import Category, Preference, Task
from scheduler.engine.availability import SchedulerAvailabilityMixin
from scheduler.engine.categories import SchedulerCategoryMixin
from scheduler.engine.scheduling import SchedulerSchedulingMixin
from scheduler.scheduler_types import ScheduleResult


class FakeScheduler(SchedulerAvailabilityMixin, SchedulerCategoryMixin):
    def __init__(self, preference=None):
        self.preference = preference
        self.scheduled_tasks = []
        self._scheduled_task_segments = []
        self._scheduled_blocks = []
        self.commutes = []
        self.event_slots = []

    def _aware(self, dt):
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def _day_window(self, target_date):
        return (
            self._aware(datetime.combine(target_date, time(7, 0))),
            self._aware(datetime.combine(target_date, time(23, 0))),
        )

    def _working_window(self, target_date):
        return self._day_window(target_date)

    def _get_expanded_event_slots(self, target_date):
        return self.event_slots

    def _expand_task_segment(self, task, start, end):
        return (
            start - timedelta(minutes=task.buffer_before_minutes),
            end + timedelta(minutes=task.buffer_after_minutes),
        )

    @staticmethod
    def _ceil_to_minute(dt):
        if dt.second == 0 and dt.microsecond == 0:
            return dt
        return (dt + timedelta(minutes=1)).replace(second=0, microsecond=0)


class FakeSchedulingScheduler(SchedulerSchedulingMixin):
    def __init__(self):
        self.allow_split = True
        self.min_block_minutes = 30
        self.tasks = []
        self._scheduled_blocks = []
        self._scheduled_task_segments = []
        self.available_days = set()
        self.slot_map = {}
        self.remaining_minutes = {}
        self.category_minutes = {}
        self.task_slot_overrides = {}

    @staticmethod
    def _aware(dt):
        return dt

    def _get_task_remaining_minutes(self, task):
        return self.remaining_minutes.get(task.id, task.remaining_minutes)

    def _iter_search_dates(self, start_date, deadline):
        current = start_date
        while current <= deadline.date():
            yield current
            current += timedelta(days=1)

    def _is_day_available(self, target_date):
        return target_date in self.available_days

    def _task_slots_for_date(
        self,
        task,
        current_date,
        min_minutes,
        task_start,
        deadline,
    ):
        return self.slot_map.get((task.id, current_date), [])

    def _shrink_slot_for_task(self, task, slot):
        return self.task_slot_overrides.get(task.id, slot)

    def _get_remaining_category_minutes(
        self,
        task,
        target_date,
        current_segments=None,
    ):
        return self.category_minutes.get((task.id, target_date))

    @staticmethod
    def _get_task_buffer_minutes(task):
        return task.buffer_before_minutes, task.buffer_after_minutes

    @staticmethod
    def _expand_task_segment(task, start, end):
        return start, end


