"""Tests for scheduler.engine.data."""

from datetime import date, datetime, time, timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Preference, SpecialDates, Task
from scheduler.engine.scheduler import Scheduler


class SchedulerDataMixinTests(TestCase):
    """Test scheduler data loading and helper utilities."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduler-data-user",
            password="password123",
            email="scheduler-data@example.com",
        )
        self.reference_day = date(2026, 3, 20)
        self.reference_dt = timezone.make_aware(
            datetime.combine(self.reference_day, time(9, 0))
        )
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
        )

    def _task(
        self,
        title,
        *,
        allocation=None,
        completed=False,
        locked=False,
        estimated_minutes=60,
        completed_minutes=0,
        buffer_before=0,
        buffer_after=0,
    ):
        return Task.objects.create(
            user=self.user,
            title=title,
            description="",
            estimated_minutes=estimated_minutes,
            completed_minutes=completed_minutes,
            start_time=self.reference_dt,
            deadline=self.reference_dt + timedelta(days=1),
            importance=5,
            allocation=allocation or [],
            total_task_allocations=len(allocation or []),
            completed=completed,
            locked=locked,
            buffer_before_minutes=buffer_before,
            buffer_after_minutes=buffer_after,
        )

    def test_unscheduled_tasks_respect_locked_and_task_id_filters(self):
        unlocked = self._task("Unlocked task")
        locked = self._task("Locked task", locked=True)
        ignored = self._task("Ignored task")

        scheduler = Scheduler(
            self.user,
            task_ids=[unlocked.id, locked.id],
            include_locked_task_ids=[locked.id],
        )

        self.assertEqual(
            [task.id for task in scheduler._get_unscheduled_tasks()],
            [unlocked.id, locked.id],
        )
        self.assertNotIn(ignored.id, [task.id for task in scheduler.tasks])

    def test_scheduled_tasks_and_special_dates_are_loaded(self):
        scheduled = self._task(
            "Scheduled task",
            allocation=[
                {
                    "start": self.reference_dt.isoformat(),
                    "end": (self.reference_dt + timedelta(minutes=30)).isoformat(),
                }
            ],
        )
        self._task(
            "Completed scheduled task",
            allocation=[
                {
                    "start": self.reference_dt.isoformat(),
                    "end": (self.reference_dt + timedelta(minutes=30)).isoformat(),
                }
            ],
            completed=True,
        )
        SpecialDates.objects.create(
            user=self.user,
            date=self.reference_day,
            text="Holiday",
        )

        scheduler = Scheduler(self.user)

        self.assertEqual(
            [task.id for task in scheduler._get_scheduled_tasks()],
            [scheduled.id],
        )
        self.assertEqual(scheduler.special_dates, {self.reference_day})

    def test_data_helpers_cover_remaining_minutes_rounding_and_buffers(self):
        scheduler = Scheduler(self.user)
        task = self._task(
            "Buffered task",
            estimated_minutes=60,
            completed_minutes=80,
            buffer_before=10,
            buffer_after=5,
        )

        self.assertEqual(scheduler._get_task_remaining_minutes(task), 0)

        naive_dt = datetime(2026, 3, 20, 9, 0)
        aware_dt = timezone.make_aware(datetime(2026, 3, 20, 9, 0))
        rounded_dt = timezone.make_aware(datetime(2026, 3, 20, 9, 0, 27))

        self.assertTrue(timezone.is_aware(scheduler._aware(naive_dt)))
        self.assertEqual(scheduler._aware(aware_dt), aware_dt)
        self.assertEqual(scheduler._ceil_to_minute(rounded_dt).minute, 1)
        self.assertEqual(scheduler._ceil_to_minute(rounded_dt).second, 0)

        self.assertEqual(scheduler._get_task_buffer_minutes(task), (10, 5))
        self.assertEqual(
            scheduler._expand_task_segment(
                task,
                aware_dt,
                aware_dt + timedelta(minutes=30),
            ),
            (
                aware_dt - timedelta(minutes=10),
                aware_dt + timedelta(minutes=35),
            ),
        )
        self.assertEqual(
            scheduler._shrink_slot_for_task(
                task,
                (
                    aware_dt,
                    aware_dt + timedelta(minutes=30),
                ),
            ),
            (
                aware_dt + timedelta(minutes=10),
                aware_dt + timedelta(minutes=25),
            ),
        )
        self.assertIsNone(
            scheduler._shrink_slot_for_task(
                task,
                (
                    aware_dt,
                    aware_dt + timedelta(minutes=10),
                ),
            )
        )

    def test_working_window_bounds_and_search_dates_follow_preferences(self):
        scheduler = Scheduler(self.user, max_days_ahead=2)
        task_start = timezone.make_aware(
            datetime.combine(self.reference_day, time(10, 0))
        )
        deadline = timezone.make_aware(
            datetime.combine(self.reference_day + timedelta(days=4), time(12, 0))
        )

        working_start, working_end = scheduler._working_window(self.reference_day)
        self.assertEqual(working_start.time(), time(8, 0))
        self.assertEqual(working_end.time(), time(22, 0))

        self.assertEqual(
            scheduler._task_date_bounds(task_start, deadline, self.reference_day),
            (task_start, None),
        )
        self.assertEqual(
            scheduler._task_date_bounds(task_start, deadline, deadline.date()),
            (None, deadline),
        )
        self.assertEqual(
            scheduler._iter_search_dates(self.reference_day, deadline),
            [
                self.reference_day,
                self.reference_day + timedelta(days=1),
                self.reference_day + timedelta(days=2),
            ],
        )

    def test_expanded_event_slots_are_cached_per_day(self):
        scheduler = Scheduler(self.user)
        day_start = timezone.make_aware(datetime.combine(self.reference_day, time.min))
        day_end = timezone.make_aware(datetime.combine(self.reference_day, time.max))
        instances = [
            SimpleNamespace(
                start_time=self.reference_dt,
                end_time=self.reference_dt + timedelta(minutes=45),
            )
        ]

        with patch(
            "scheduler.engine.data.expand_user_events",
            return_value=instances,
        ) as mock_expand:
            first = scheduler._get_expanded_event_slots(self.reference_day)
            second = scheduler._get_expanded_event_slots(self.reference_day)

        self.assertEqual(
            first,
            [(self.reference_dt, self.reference_dt + timedelta(minutes=45))],
        )
        self.assertEqual(second, first)
        mock_expand.assert_called_once_with(self.user, day_start, day_end)
