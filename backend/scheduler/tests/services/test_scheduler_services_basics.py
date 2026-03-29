"""Tests for scheduler service behaviour."""

from datetime import date, datetime, time, timedelta
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from core.models import DayOfWeek, Event, SpecialDates, Task
from scheduler.services import Scheduler

from .scheduler_services_support import SchedulerServicesSupport


class SchedulerServiceBasicsTests(SchedulerServicesSupport, TestCase):
    """Test cases for scheduler service basics."""
    def test_get_preference(self):
        """Test get preference."""
        scheduler = Scheduler(self.user)
        self.assertEqual(scheduler._get_preference(), self.preference)

    def test_get_unscheduled_tasks(self):
        """Test get unscheduled tasks."""
        task1 = Task.objects.create(
            user=self.user,
            title="Important Report",
            description="Write the monthly report",
            estimated_minutes=120,
            importance=3,
            start_time=timezone.now() + timedelta(hours=1),
            deadline=timezone.make_aware(datetime(2026, 2, 20, 17, 0)),
            completed=False,
        )
        Task.objects.create(
            user=self.user,
            title="Grocery Shopping",
            description="Buy groceries for the week",
            estimated_minutes=60,
            importance=1,
            start_time=timezone.now() + timedelta(hours=1),
            deadline=timezone.make_aware(datetime(2026, 2, 18, 12, 0)),
            completed=False,
        )

        scheduler = Scheduler(self.user)
        tasks = scheduler._get_unscheduled_tasks()
        self.assertEqual(len(tasks), 2)
        self.assertEqual(tasks[0], task1)  # higher importance first

    def test_get_events(self):
        """Test get events."""
        event1 = Event.objects.create(
            user=self.user,
            title="Team Meeting",
            start_time=timezone.make_aware(datetime(2026, 2, 13, 10, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 13, 11, 0)),
        )
        Event.objects.create(
            user=self.user,
            title="Doctor's Appointment",
            start_time=timezone.make_aware(datetime(2026, 2, 14, 14, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 14, 15, 0)),
        )

        scheduler = Scheduler(self.user)
        events = scheduler._get_events()
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0], event1)

    def test_is_day_available_with_days_off_and_special_dates(self):
        """Test is day available with days off and special dates."""
        target_date = date(2026, 2, 12)  # Thursday
        scheduler = Scheduler(self.user)
        self.assertTrue(scheduler._is_day_available(target_date))

        thursday = DayOfWeek.objects.get_or_create(day=4)[0]
        self.preference.days_off.add(thursday)
        scheduler = Scheduler(self.user)
        self.assertFalse(scheduler._is_day_available(target_date))

        self.preference.days_off.clear()
        SpecialDates.objects.create(user=self.user, date=target_date, text="Holiday")
        scheduler = Scheduler(self.user)
        self.assertFalse(scheduler._is_day_available(target_date))

    def test_schedule_single_task_no_split(self):
        """Test schedule single task no split."""
        Task.objects.create(
            user=self.user,
            title="Write summary",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=self.reference_dt,
            deadline=timezone.make_aware(datetime(2026, 2, 20, 12, 0)),
            completed=False,
        )
        scheduler = Scheduler(self.user, max_days_ahead=3, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIsNotNone(results[0].scheduled_start)
        self.assertEqual(results[0].scheduled_start.date(), date(2026, 2, 12))

    def test_schedule_task_split_across_days(self):
        """Test schedule task split across days."""
        base_day = timezone.localdate() + timedelta(days=1)
        # Leave only 60 mins on day 1; rest on day 2
        Event.objects.create(
            user=self.user,
            title="Long event",
            start_time=timezone.make_aware(datetime.combine(base_day, time(8, 0))),
            end_time=timezone.make_aware(datetime.combine(base_day, time(22, 0))),
        )
        Task.objects.create(
            user=self.user,
            title="Large task",
            description="",
            estimated_minutes=120,
            importance=8,
            start_time=timezone.make_aware(datetime.combine(base_day, time(7, 0))),
            deadline=timezone.make_aware(
                datetime.combine(base_day + timedelta(days=2), time(18, 0))
            ),
            completed=False,
        )
        scheduler = Scheduler(
            self.user, max_days_ahead=3, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=base_day)

        self.assertTrue(results[0].success)
        self.assertGreater(results[0].scheduled_end, results[0].scheduled_start)

    def test_schedule_respects_deadline(self):
        """Test schedule respects deadline."""
        Task.objects.create(
            user=self.user,
            title="Overdue",
            description="",
            estimated_minutes=30,
            importance=1,
            start_time=self.reference_dt,
            deadline=timezone.make_aware(datetime(2026, 2, 10, 10, 0)),
            completed=False,
        )
        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertFalse(results[0].success)
        self.assertIn("Deadline", results[0].reason)

    def test_schedule_includes_deadline_day_within_horizon(self):
        """Test schedule includes deadline day within horizon."""
        start_date = date(2026, 3, 19)
        deadline_dt = timezone.make_aware(datetime(2026, 3, 26, 10, 0))
        mocked_now = timezone.make_aware(datetime(2026, 3, 19, 6, 0))

        for offset in range(7):
            blocked_day = start_date + timedelta(days=offset)
            Event.objects.create(
                user=self.user,
                title=f"Block {blocked_day.isoformat()}",
                start_time=timezone.make_aware(
                    datetime.combine(blocked_day, time(7, 0))
                ),
                end_time=timezone.make_aware(
                    datetime.combine(blocked_day, time(23, 0))
                ),
            )

        Task.objects.create(
            user=self.user,
            title="Boundary deadline task",
            description="",
            estimated_minutes=59,
            importance=5,
            start_time=timezone.make_aware(datetime(2026, 3, 19, 13, 0)),
            deadline=deadline_dt,
            completed=False,
            allow_split=True,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=7, allow_split=True, min_block_minutes=30
        )
        mocked_now = timezone.make_aware(datetime.combine(start_date, time(0, 0)))
        with (
            patch(
                "scheduler.engine.availability.timezone.localdate",
                return_value=start_date,
            ),
            patch(
                "scheduler.engine.availability.timezone.now", return_value=mocked_now
            ),
        ):
            results = scheduler.schedule_tasks(start_date=start_date)

        self.assertTrue(results[0].success)
        self.assertEqual(results[0].scheduled_start.date(), deadline_dt.date())
