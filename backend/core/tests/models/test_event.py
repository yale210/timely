import datetime

from django.contrib.auth import get_user_model
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
            time=datetime.time(10, 0),
            date=today,
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
