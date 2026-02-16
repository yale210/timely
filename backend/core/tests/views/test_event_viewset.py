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
            "importance": 5,
            "start_time": now + datetime.timedelta(hours=3),
            "end_time": now + datetime.timedelta(hours=4),
            "reminders": [
                {"send_push": True, "send_email": False, "minutes_before": 15},
                {"send_push": False, "send_email": True, "minutes_before": 60},
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
            importance=5,
            start_time=now + datetime.timedelta(hours=3),
            end_time=now + datetime.timedelta(hours=4),
        )
        EventReminder.objects.create(event=event, send_push=True, minutes_before=10)

        url = reverse("event-detail", args=[event.id])
        data = {
            "title": "New Title",
            "importance": 5,
            "start_time": now + datetime.timedelta(hours=3),
            "end_time": now + datetime.timedelta(hours=4),
            "reminders": [
                {"send_push": False, "send_email": True, "minutes_before": 20}
            ],
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        event.refresh_from_db()
        self.assertEqual(event.title, "New Title")
        self.assertEqual(event.reminders.count(), 1)
        self.assertTrue(event.reminders.first().send_email)
        self.assertFalse(event.reminders.first().send_push)
        self.assertEqual(event.reminders.first().minutes_before, 20)

    def test_get_events_includes_reminders(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Event with Reminders",
            importance=5,
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        EventReminder.objects.create(event=event, send_push=True, minutes_before=10)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(len(response.data[0]["reminders"]), 1)
        self.assertTrue(response.data[0]["reminders"][0]["send_push"])
        self.assertFalse(response.data[0]["reminders"][0]["send_email"])

    def test_create_event_with_max_reminders(self):
        """Test that an event can have up to 5 reminders."""
        now = timezone.now()
        data = {
            "title": "Event with 5 reminders",
            "importance": 5,
            "start_time": now + datetime.timedelta(hours=3),
            "end_time": now + datetime.timedelta(hours=4),
            "reminders": [
                {"send_push": True, "minutes_before": 5},
                {"send_push": True, "minutes_before": 10},
                {"send_push": True, "minutes_before": 15},
                {"send_email": True, "minutes_before": 30},
                {"send_email": True, "minutes_before": 60},
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
            "importance": 5,
            "start_time": now + datetime.timedelta(hours=5),
            "end_time": now + datetime.timedelta(hours=6),
            "reminders": [
                {"send_push": True, "minutes_before": 5},
                {"send_push": True, "minutes_before": 10},
                {"send_push": True, "minutes_before": 15},
                {"send_email": True, "minutes_before": 30},
                {"send_email": True, "minutes_before": 60},
                {
                    "send_push": True,
                    "minutes_before": 120,
                },  # 6th reminder - should fail
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
            "importance": 5,
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
