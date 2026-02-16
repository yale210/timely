from datetime import date, time, datetime, timedelta
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

from core.models import Task, Event, Commute, Preference, DayOfWeek
from scheduler.services import Scheduler, TimeSlot, ScheduleResult


class SchedulerTest(TestCase):
    def setUp(self):
        # Create a real Django user for database queries
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password"
        )

        # Create a real preference for the user
        self.preference = Preference.objects.create(
            user=self.user,
            sleep_start=time(23, 0),
            sleep_end=time(7, 0)
        )

        self.scheduler = Scheduler(self.user)

    def test_get_preference(self):
        preference = self.scheduler._get_preference()
        self.assertEqual(preference, self.preference)

    def test_get_unscheduled_tasks(self):
        task1 = Task.objects.create(
            user=self.user,
            title="Important Report",
            description="Write the monthly report",
            estimated_minutes=120,
            importance=3,
            start_time = timezone.now() + timedelta(hours=1),
            deadline=date(2026, 2, 20),
            completed=False,
        )
        task2 = Task.objects.create(
            user=self.user,
            title="Grocery Shopping",
            description="Buy groceries for the week",
            estimated_minutes=60,
            importance=1,
            start_time = timezone.now() + timedelta(hours=1),
            deadline=date(2026, 2, 18),
            completed=False,
        )

        tasks = self.scheduler._get_unscheduled_tasks()
        self.assertEqual(len(tasks), 0) # changed test from 2 to 0, tasks are always scheduled now


    def test_get_events(self):
        event1 = Event.objects.create(
            user=self.user,
            title="Team Meeting",
            start_time=timezone.make_aware(datetime(2026, 2, 13, 10, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 13, 11, 0)),
        )

        event2 = Event.objects.create(
            user=self.user,
            title="Doctor's Appointment",
            start_time=timezone.make_aware(datetime(2026, 2, 14, 14, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 14, 15, 0)),
        )

        events = self.scheduler._get_events()
        self.assertEqual(len(events), 0)


    def test_get_commutes(self):
        commute1 = Commute.objects.create(
            user=self.user,
            commute_start=time(8, 30),
            commute_end=time(9, 0),
        )
        commute2 = Commute.objects.create(
            user=self.user,
            commute_start=time(17, 0),
            commute_end=time(17, 30),
        )

        commutes = self.scheduler._get_commutes()
        self.assertEqual(len(commutes), 0)

    def test_is_day_available(self):
        target_date = date(2026, 2, 12)  # A Thursday
        self.assertTrue(self.scheduler._is_day_available(target_date))

        # Test with a day off - create Thursday (4) as day off
        thursday = DayOfWeek.objects.get_or_create(day=4)[0]
        self.preference.days_off.add(thursday)
        self.assertFalse(self.scheduler._is_day_available(target_date))

        # Remove the day off for other tests
        self.preference.days_off.remove(thursday)

        # Test without preference
        Preference.objects.all().delete()
        scheduler_no_preference = Scheduler(self.user)
        self.assertTrue(scheduler_no_preference._is_day_available(target_date))