import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from core.models import Event


class EventTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
        )

    def test_event_calculate_time_left(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            importance=5,
            recurring=True,
            recurring_start=today,
            recurring_end=today + datetime.timedelta(days=10),
            recurring_interval="daily",
        )

        self.assertEqual(event.calculate_time_left(), 10)

    def test_event_calculate_time_left_zero_days(self):
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=datetime.date(2025, 1, 1),
            importance=5,
            recurring=False,
        )

        self.assertEqual(event.calculate_time_left(), 0)

    def test_event_calculate_time_left_one_off_event(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=today + datetime.timedelta(days=10),
            importance=5,
            recurring=False,
        )

        self.assertEqual(event.calculate_time_left(), 10)

    def test_event_is_linked_to_user(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=today,
            importance=5,
            recurring=False,
        )

        self.assertEqual(event.user, self.user)
        self.assertEqual(self.user.events.count(), 1)

    def test_recurring_event_requires_start_date(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                importance=5,
                recurring=True,
                recurring_end=today + datetime.timedelta(days=10),
                recurring_interval="daily",
            )
        self.assertIn("recurring_start", context.exception.message_dict)

    def test_recurring_event_requires_end_date(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                importance=5,
                recurring=True,
                recurring_start=today,
                recurring_interval="daily",
            )
        self.assertIn("recurring_end", context.exception.message_dict)

    def test_recurring_event_requires_interval(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                importance=5,
                recurring=True,
                recurring_start=today,
                recurring_end=today + datetime.timedelta(days=10),
            )
        self.assertIn("recurring_interval", context.exception.message_dict)

    def test_recurring_event_requires_start_before_end(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                importance=5,
                recurring=True,
                recurring_start=today + datetime.timedelta(days=10),
                recurring_end=today,
                recurring_interval="daily",
            )
        self.assertIn("recurring_start", context.exception.message_dict)

    def test_recurring_event_cannot_have_time(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                time=datetime.time(10, 0),
                importance=5,
                recurring=True,
                recurring_start=today,
                recurring_end=today + datetime.timedelta(days=10),
                recurring_interval="daily",
            )
        self.assertIn("time", context.exception.message_dict)

    def test_recurring_event_cannot_have_date(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                date=today,
                importance=5,
                recurring=True,
                recurring_start=today,
                recurring_end=today + datetime.timedelta(days=10),
                recurring_interval="daily",
            )
        self.assertIn("date", context.exception.message_dict)

    def test_one_off_event_requires_time(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                date=today,
                importance=5,
                recurring=False,
            )
        self.assertIn("time", context.exception.message_dict)

    def test_one_off_event_requires_date(self):
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                time=datetime.time(10, 0),
                importance=5,
                recurring=False,
            )
        self.assertIn("date", context.exception.message_dict)

    def test_one_off_event_cannot_have_recurring_start(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                time=datetime.time(10, 0),
                date=today,
                importance=5,
                recurring=False,
                recurring_start=today,
            )
        self.assertIn("recurring_start", context.exception.message_dict)

    def test_one_off_event_cannot_have_recurring_end(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                time=datetime.time(10, 0),
                date=today,
                importance=5,
                recurring=False,
                recurring_end=today + datetime.timedelta(days=10),
            )
        self.assertIn("recurring_end", context.exception.message_dict)

    def test_one_off_event_cannot_have_recurring_interval(self):
        today = timezone.now().date()
        with self.assertRaises(ValidationError) as context:
            Event.objects.create(
                user=self.user,
                event_category=None,
                time=datetime.time(10, 0),
                date=today,
                importance=5,
                recurring=False,
                recurring_interval="daily",
            )
        self.assertIn("recurring_interval", context.exception.message_dict)

    def test_valid_recurring_event_saves_successfully(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            importance=5,
            recurring=True,
            recurring_start=today,
            recurring_end=today + datetime.timedelta(days=10),
            recurring_interval="daily",
        )
        self.assertTrue(event.recurring)
        self.assertEqual(event.recurring_start, today)

    def test_valid_one_off_event_saves_successfully(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=today,
            importance=5,
            recurring=False,
        )
        self.assertFalse(event.recurring)
        self.assertEqual(event.time, datetime.time(10, 0))
