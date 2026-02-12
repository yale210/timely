import datetime
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from core.models import Event


class EventTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )

    def test_event_calculate_time_left_one_off(self):
        now = timezone.now()
        start_time = now + datetime.timedelta(days=10)
        end_time = start_time + datetime.timedelta(hours=1)
        event = Event.objects.create(
            user=self.user,
            title="Test Event",
            start_time=start_time,
            end_time=end_time,
        )
        # 10 days from now
        self.assertEqual(event.calculate_time_left(), 10)

    def test_event_calculate_time_left_recurring(self):
        now = timezone.now()
        start_time = now
        end_time = now + datetime.timedelta(hours=1)
        recurrence_end = (now + datetime.timedelta(days=15)).date()
        event = Event.objects.create(
            user=self.user,
            title="Recurring Event",
            start_time=start_time,
            end_time=end_time,
            recurrence_interval="daily",
            recurrence_end=recurrence_end,
        )
        # 15 days from now
        self.assertEqual(event.calculate_time_left(), 15)

    def test_event_end_time_after_start_time(self):
        now = timezone.now()
        start_time = now
        end_time = now - datetime.timedelta(hours=1)
        with self.assertRaises(ValidationError) as context:
            event = Event(
                user=self.user,
                title="Invalid Event",
                start_time=start_time,
                end_time=end_time,
            )
            event.full_clean()
        self.assertIn("end_time", context.exception.message_dict)

    def test_event_is_linked_to_user(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="User Event",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.user, self.user)
        self.assertEqual(self.user.events.count(), 1)

    def test_recurring_event_allows_no_end_date(self):
        now = timezone.now()
        # Recurring event WITHOUT end date should be valid (i.e., "never" ending)
        event = Event(
            user=self.user,
            title="Never Ending Event",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        # Should NOT raise an exception
        event.full_clean()
        event.save()
        self.assertEqual(Event.objects.filter(title="Never Ending Event").count(), 1)

    def test_recurrence_end_requires_interval(self):
        now = timezone.now()
        # Test: end date without interval is invalid
        with self.assertRaises(ValidationError) as context:
            event = Event(
                user=self.user,
                title="Missing Interval",
                start_time=now,
                end_time=now + datetime.timedelta(hours=1),
                recurrence_end=now.date() + datetime.timedelta(days=7),
            )
            event.full_clean()
        self.assertIn("recurrence_interval", context.exception.message_dict)

    def test_recurrence_end_after_start_time(self):
        now = timezone.now()
        start_time = now
        recurrence_end = (now - datetime.timedelta(days=1)).date()
        with self.assertRaises(ValidationError) as context:
            event = Event(
                user=self.user,
                title="Invalid Recurrence End",
                start_time=start_time,
                end_time=start_time + datetime.timedelta(hours=1),
                recurrence_interval="daily",
                recurrence_end=recurrence_end,
            )
            event.full_clean()
        self.assertIn("recurrence_end", context.exception.message_dict)

    def test_calculate_time_left_no_start_time(self):
        event = Event(user=self.user, title="No Start Time")
        event.start_time = None
        self.assertEqual(event.calculate_time_left(), 0)
