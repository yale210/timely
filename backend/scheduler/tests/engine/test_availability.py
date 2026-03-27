"""Tests for scheduler.engine.availability."""

from datetime import date, datetime, time, timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.utils.timezone import make_aware

from core.models import Preference, Task
from scheduler.engine.availability import SchedulerAvailabilityMixin
from scheduler.engine.categories import SchedulerCategoryMixin


class FakeScheduler(SchedulerAvailabilityMixin, SchedulerCategoryMixin):
    """Test double for the scheduler availability mixin."""

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


class SchedulerAvailabilityMixinTests(TestCase):
    """Test availability calculations and commute handling."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduler-mixin-user",
            password="password123",
            email="scheduler@example.com",
        )
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
            max_hours_study_per_day=2,
            limit_max_hours=True,
        )
        self.scheduler = FakeScheduler(preference=self.preference)
        self.target_date = date(2026, 3, 20)

    def _task(self, title, *, allocation=None, buffer_before=0, buffer_after=0):
        task = Task.objects.create(
            user=self.user,
            title=title,
            description="",
            estimated_minutes=120,
            completed_minutes=0,
            start_time=make_aware(datetime.combine(self.target_date, time(7, 0))),
            deadline=make_aware(datetime.combine(self.target_date, time(23, 0))),
            importance=5,
            allocation=allocation or [],
            total_task_allocations=len(allocation or []),
            buffer_before_minutes=buffer_before,
            buffer_after_minutes=buffer_after,
        )
        return task

    def test_commute_slots_and_application_rules(self):
        matching_day = SimpleNamespace(day=5)
        non_matching_day = SimpleNamespace(day=2)
        matching_commute = SimpleNamespace(
            commute_start=time(8, 0),
            commute_end=time(8, 30),
            day_of_week=SimpleNamespace(all=lambda: [matching_day]),
        )
        non_matching_commute = SimpleNamespace(
            commute_start=time(9, 0),
            commute_end=time(9, 30),
            day_of_week=SimpleNamespace(all=lambda: [non_matching_day]),
        )
        always_commute = SimpleNamespace(
            commute_start=time(10, 0),
            commute_end=time(10, 15),
        )
        self.scheduler.commutes = [
            matching_commute,
            non_matching_commute,
            always_commute,
        ]

        occupied = self.scheduler._commute_slots(self.target_date)

        self.assertEqual(len(occupied), 2)
        self.assertTrue(
            self.scheduler._commute_applies(
                SimpleNamespace(
                    day_of_week=SimpleNamespace(all=lambda: [matching_day])
                ),
                self.target_date,
            )
        )
        self.assertTrue(
            self.scheduler._commute_applies(
                SimpleNamespace(day_of_week=None), self.target_date
            )
        )

    def test_get_available_slots_applies_trimming_blocks_and_capacity(self):
        self.scheduler.event_slots = [
            (
                make_aware(datetime.combine(self.target_date, time(9, 0))),
                make_aware(datetime.combine(self.target_date, time(10, 0))),
            )
        ]
        self.scheduler._scheduled_blocks = [
            (
                make_aware(datetime.combine(self.target_date, time(13, 0))),
                make_aware(datetime.combine(self.target_date, time(14, 0))),
            )
        ]
        buffered_task = self._task(
            "Buffered",
            allocation=[
                {
                    "start": make_aware(
                        datetime.combine(self.target_date, time(11, 0))
                    ).isoformat(),
                    "end": make_aware(
                        datetime.combine(self.target_date, time(11, 30))
                    ).isoformat(),
                }
            ],
            buffer_after=30,
        )
        self.scheduler.scheduled_tasks = [buffered_task]

        future_slots = self.scheduler.get_available_slots(
            self.target_date,
            15,
            not_before=make_aware(datetime.combine(self.target_date, time(8, 0))),
            not_after=make_aware(datetime.combine(self.target_date, time(15, 0))),
        )
        self.assertTrue(future_slots)

        self.preference.max_hours_study_per_day = 0
        self.preference.save(update_fields=["max_hours_study_per_day"])
        mocked_now = make_aware(datetime.combine(self.target_date, time(8, 14, 10)))
        with (
            patch(
                "scheduler.engine.availability.timezone.localdate",
                return_value=self.target_date,
            ),
            patch(
                "scheduler.engine.availability.timezone.now",
                return_value=mocked_now,
            ),
        ):
            slots = self.scheduler.get_available_slots(self.target_date, 15)
        self.assertEqual(slots, [])

    def test_apply_daily_capacity_can_be_disabled_and_counts_scheduled_segments(self):
        window = self.scheduler._day_window(self.target_date)
        task = self._task(
            "Scheduled task",
            allocation=[
                {
                    "start": make_aware(
                        datetime.combine(self.target_date, time(9, 0))
                    ).isoformat(),
                    "end": make_aware(
                        datetime.combine(self.target_date, time(9, 30))
                    ).isoformat(),
                }
            ],
        )
        self.scheduler.scheduled_tasks = [task]
        self.scheduler._scheduled_task_segments = [
            (
                task,
                make_aware(datetime.combine(self.target_date, time(10, 0))),
                make_aware(datetime.combine(self.target_date, time(10, 20))),
            )
        ]

        self.assertEqual(self.scheduler._scheduled_minutes_in_window(window), 50)

        self.preference.limit_max_hours = False
        self.preference.save(update_fields=["limit_max_hours"])
        free_slots = [(window[0], window[0] + timedelta(minutes=30))]

        self.assertEqual(
            self.scheduler._apply_daily_capacity(window, free_slots),
            free_slots,
        )
