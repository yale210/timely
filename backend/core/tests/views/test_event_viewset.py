import datetime
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from core.models import Event, EventReminder


class EventViewSetTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("event-list")

    def test_create_event_with_reminders(self):
        now = timezone.now()
        data = {
            "title": "API Event",
            "start_time": now + datetime.timedelta(hours=1),
            "end_time": now + datetime.timedelta(hours=2),
            "reminders": [
                {"type": "popup", "minutes_before": 15},
                {"type": "email", "minutes_before": 60},
            ],
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 1)
        self.assertEqual(EventReminder.objects.count(), 2)

        event = Event.objects.first()
        self.assertEqual(event.title, "API Event")
        self.assertEqual(event.reminders.count(), 2)

    def test_update_event_reminders(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Old Title",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        EventReminder.objects.create(event=event, type="popup", minutes_before=10)

        url = reverse("event-detail", args=[event.id])
        data = {
            "title": "New Title",
            "start_time": now,
            "end_time": now + datetime.timedelta(hours=1),
            "reminders": [{"type": "email", "minutes_before": 20}],
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        event.refresh_from_db()
        self.assertEqual(event.title, "New Title")
        self.assertEqual(event.reminders.count(), 1)
        self.assertEqual(event.reminders.first().type, "email")
        self.assertEqual(event.reminders.first().minutes_before, 20)

    def test_get_events_includes_reminders(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Event with Reminders",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        EventReminder.objects.create(event=event, type="popup", minutes_before=10)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(len(response.data[0]["reminders"]), 1)
        self.assertEqual(response.data[0]["reminders"][0]["type"], "popup")

    def test_create_event_with_max_reminders(self):
        """Test that an event can have up to 5 reminders."""
        now = timezone.now()
        data = {
            "title": "Event with 5 reminders",
            "start_time": now + datetime.timedelta(hours=1),
            "end_time": now + datetime.timedelta(hours=2),
            "reminders": [
                {"type": "popup", "minutes_before": 5},
                {"type": "popup", "minutes_before": 10},
                {"type": "popup", "minutes_before": 15},
                {"type": "email", "minutes_before": 30},
                {"type": "email", "minutes_before": 60},
            ],
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EventReminder.objects.count(), 5)

    def test_create_event_exceeds_max_reminders(self):
        """Test that an event cannot have more than 5 reminders."""
        now = timezone.now()
        data = {
            "title": "Event with too many reminders",
            "start_time": now + datetime.timedelta(hours=1),
            "end_time": now + datetime.timedelta(hours=2),
            "reminders": [
                {"type": "popup", "minutes_before": 5},
                {"type": "popup", "minutes_before": 10},
                {"type": "popup", "minutes_before": 15},
                {"type": "email", "minutes_before": 30},
                {"type": "email", "minutes_before": 60},
                {"type": "popup", "minutes_before": 120},  # 6th reminder - should fail
            ],
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reminders", response.data)
        self.assertEqual(Event.objects.count(), 0)

    def test_create_recurring_event_without_end_date(self):
        """Test that recurring events can be created without an end date (never ending)."""
        now = timezone.now()
        data = {
            "title": "Never Ending Event",
            "start_time": now + datetime.timedelta(hours=1),
            "end_time": now + datetime.timedelta(hours=2),
            "recurrence_interval": "weekly",
            "recurrence_end": None,
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = Event.objects.first()
        self.assertEqual(event.recurrence_interval, "weekly")
        self.assertIsNone(event.recurrence_end)
