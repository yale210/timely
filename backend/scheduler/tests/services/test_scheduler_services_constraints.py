"""Tests for scheduler service behaviour."""

from datetime import date, datetime, time, timedelta

from django.test import TestCase
from django.utils import timezone

from core.models import Category, Event, Task
from scheduler.services import Scheduler

from .scheduler_services_support import SchedulerServicesSupport


class SchedulerServiceConstraintTests(SchedulerServicesSupport, TestCase):
    """Test cases for scheduler service constraint."""
    def test_schedule_does_not_place_task_before_task_start_time(self):
        """Test schedule does not place task before task start time."""
        task = Task.objects.create(
            user=self.user,
            title="Afternoon task",
            description="",
            estimated_minutes=60,
            importance=5,
            start_time=timezone.make_aware(datetime(2026, 3, 19, 13, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 19, 18, 0)),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 3, 19))

        self.assertTrue(results[0].success)
        self.assertGreaterEqual(results[0].scheduled_start, task.start_time)

    def test_schedule_task_split_uses_task_min_split_minutes(self):
        """Test schedule task split uses task min split minutes."""
        day_one = timezone.localdate() + timedelta(days=1)

        Task.objects.create(
            user=self.user,
            title="Small block split task",
            description="",
            estimated_minutes=30,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(day_one, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=15,
            max_split_minutes=15,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=2, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=day_one)

        self.assertTrue(results[0].success)
        self.assertEqual(len(results[0].segments), 2)
        self.assertEqual(
            [
                int((end - start).total_seconds() // 60)
                for start, end in results[0].segments
            ],
            [15, 15],
        )

    def test_schedule_task_split_respects_task_max_split_minutes(self):
        """Test schedule task split respects task max split minutes."""
        start_day = date(2026, 3, 19)

        Task.objects.create(
            user=self.user,
            title="Max block split task",
            description="",
            estimated_minutes=150,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=30,
            max_split_minutes=60,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=1, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertEqual(len(results[0].segments), 3)
        self.assertEqual(
            [
                int((end - start).total_seconds() // 60)
                for start, end in results[0].segments
            ],
            [60, 60, 30],
        )

    def test_schedule_task_split_does_not_create_block_below_task_minimum(self):
        """Test schedule task split does not create block below task minimum."""
        day_one = date(2026, 3, 19)
        day_two = day_one + timedelta(days=1)

        Event.objects.create(
            user=self.user,
            title="Block day one",
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 30))),
            end_time=timezone.make_aware(datetime.combine(day_one, time(23, 0))),
        )
        Event.objects.create(
            user=self.user,
            title="Block day two",
            start_time=timezone.make_aware(datetime.combine(day_two, time(7, 40))),
            end_time=timezone.make_aware(datetime.combine(day_two, time(23, 0))),
        )

        Task.objects.create(
            user=self.user,
            title="Too small final split block",
            description="",
            estimated_minutes=50,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(day_two, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=30,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=2, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=day_one)

        self.assertFalse(results[0].success)
        self.assertEqual(results[0].segments, [])

    def test_schedule_respects_category_daily_limit(self):
        """Test schedule respects category daily limit."""
        start_day = date(2026, 3, 19)
        category = Category.objects.create(
            user=self.user,
            text="Study",
            max_daily_study_time=60,
        )

        Task.objects.create(
            user=self.user,
            title="Capped category task",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=30,
        ).categories.add(category)

        scheduler = Scheduler(
            self.user, max_days_ahead=1, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertFalse(results[0].success)
        self.assertEqual(results[0].segments, [])

    def test_schedule_respects_task_buffer_before_event(self):
        """Test schedule respects task buffer before event."""
        start_day = date(2026, 3, 19)
        Event.objects.create(
            user=self.user,
            title="Blocking event",
            start_time=timezone.make_aware(datetime.combine(start_day, time(10, 0))),
            end_time=timezone.make_aware(datetime.combine(start_day, time(10, 45))),
        )
        Task.objects.create(
            user=self.user,
            title="Buffered task",
            description="",
            estimated_minutes=30,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(10, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(12, 0))),
            completed=False,
            buffer_before_minutes=30,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertGreaterEqual(
            results[0].scheduled_start,
            timezone.make_aware(datetime.combine(start_day, time(11, 15))),
        )

    def test_schedule_respects_existing_task_buffers(self):
        """Test schedule respects existing task buffers."""
        start_day = date(2026, 3, 19)
        Task.objects.create(
            user=self.user,
            title="Already scheduled buffered task",
            description="",
            estimated_minutes=30,
            importance=8,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(12, 0))),
            completed=False,
            buffer_after_minutes=30,
            allocation=[
                {
                    "start": timezone.make_aware(
                        datetime.combine(start_day, time(8, 0))
                    ).isoformat(),
                    "end": timezone.make_aware(
                        datetime.combine(start_day, time(8, 30))
                    ).isoformat(),
                }
            ],
            total_task_allocations=1,
        )
        Task.objects.create(
            user=self.user,
            title="Follow-up task",
            description="",
            estimated_minutes=30,
            importance=4,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(12, 0))),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertGreaterEqual(
            results[0].scheduled_start,
            timezone.make_aware(datetime.combine(start_day, time(9, 0))),
        )

    def test_schedule_respects_recurring_event_instances(self):
        """Test schedule respects recurring event instances."""
        start_day = timezone.localdate() + timedelta(days=1)
        Event.objects.create(
            user=self.user,
            title="Recurring block",
            start_time=timezone.make_aware(datetime.combine(start_day, time(10, 0))),
            end_time=timezone.make_aware(datetime.combine(start_day, time(11, 0))),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
        )
        Task.objects.create(
            user=self.user,
            title="Task around recurring event",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertLessEqual(
            results[0].scheduled_end,
            timezone.make_aware(datetime.combine(start_day, time(10, 0))),
        )
