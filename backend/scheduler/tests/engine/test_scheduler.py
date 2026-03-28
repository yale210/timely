"""Tests for scheduler.engine.scheduler."""

from datetime import date, datetime, time

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Preference, Task
from scheduler.engine.availability import SchedulerAvailabilityMixin
from scheduler.engine.categories import SchedulerCategoryMixin
from scheduler.engine.data import SchedulerDataMixin
from scheduler.engine.scheduler import Scheduler
from scheduler.engine.scheduling import SchedulerSchedulingMixin


class SchedulerEngineClassTests(TestCase):
    """Test the composed scheduler engine class itself."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduler-engine-user",
            password="password123",
            email="scheduler-engine@example.com",
        )
        self.reference_day = date(2026, 3, 20)
        Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
        )

    def test_scheduler_composes_expected_mixins(self):
        scheduler = Scheduler(self.user)

        self.assertIsInstance(scheduler, SchedulerDataMixin)
        self.assertIsInstance(scheduler, SchedulerAvailabilityMixin)
        self.assertIsInstance(scheduler, SchedulerCategoryMixin)
        self.assertIsInstance(scheduler, SchedulerSchedulingMixin)

    def test_scheduler_initialises_engine_state(self):
        task = Task.objects.create(
            user=self.user,
            title="Engine task",
            description="",
            estimated_minutes=60,
            completed_minutes=0,
            start_time=timezone.make_aware(
                datetime.combine(self.reference_day, time(9, 0))
            ),
            deadline=timezone.make_aware(
                datetime.combine(self.reference_day, time(18, 0))
            ),
            importance=5,
            completed=False,
        )

        scheduler = Scheduler(
            self.user,
            max_days_ahead=5,
            allow_split=True,
            min_block_minutes=20,
            task_ids=[task.id],
        )

        self.assertEqual(scheduler.user, self.user)
        self.assertEqual(scheduler.max_days_ahead, 5)
        self.assertTrue(scheduler.allow_split)
        self.assertEqual(scheduler.min_block_minutes, 20)
        self.assertEqual(scheduler.task_ids, {task.id})
        self.assertEqual(scheduler.include_locked_task_ids, set())
        self.assertEqual(scheduler.preference.user, self.user)
        self.assertEqual([loaded.id for loaded in scheduler.tasks], [task.id])
        self.assertEqual(scheduler.scheduled_tasks, [])
        self.assertEqual(scheduler.events, [])
        self.assertEqual(scheduler.special_dates, set())
        self.assertEqual(scheduler._scheduled_blocks, [])
        self.assertEqual(scheduler._scheduled_task_segments, [])
        self.assertEqual(scheduler._expanded_events_by_date, {})
