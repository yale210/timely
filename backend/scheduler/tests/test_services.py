from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Commute, DayOfWeek, Event, Preference, SpecialDates, Task
from scheduler.services import Scheduler


class SchedulerTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password",
        )
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
        )

    def test_get_preference(self):
        scheduler = Scheduler(self.user)
        self.assertEqual(scheduler._get_preference(), self.preference)

    def test_get_unscheduled_tasks(self):
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

    def test_get_commutes(self):
        Commute.objects.create(
            user=self.user,
            commute_start=time(8, 30),
            commute_end=time(9, 0),
        )
        Commute.objects.create(
            user=self.user,
            commute_start=time(17, 0),
            commute_end=time(17, 30),
        )

        scheduler = Scheduler(self.user)
        commutes = scheduler._get_commutes()
        self.assertEqual(len(commutes), 2)

    def test_is_day_available_with_days_off_and_special_dates(self):
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
        Task.objects.create(
            user=self.user,
            title="Write summary",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=timezone.now(),
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
        # Leave only 60 mins on day 1; rest on day 2
        Event.objects.create(
            user=self.user,
            title="Long event",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 8, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 22, 0)),
        )
        Task.objects.create(
            user=self.user,
            title="Large task",
            description="",
            estimated_minutes=120,
            importance=8,
            start_time=timezone.now(),
            deadline=timezone.make_aware(datetime(2026, 2, 14, 18, 0)),
            completed=False,
        )
        scheduler = Scheduler(
            self.user, max_days_ahead=3, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertTrue(results[0].success)
        self.assertGreater(results[0].scheduled_end, results[0].scheduled_start)

    def test_schedule_respects_deadline(self):
        Task.objects.create(
            user=self.user,
            title="Overdue",
            description="",
            estimated_minutes=30,
            importance=1,
            start_time=timezone.now(),
            deadline=timezone.make_aware(datetime(2026, 2, 10, 10, 0)),
            completed=False,
        )
        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertFalse(results[0].success)
        self.assertIn("Deadline", results[0].reason)
