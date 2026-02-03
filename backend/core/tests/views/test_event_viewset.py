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
            "start_time": now + datetime.timedelta(hours=1),
            "end_time": now + datetime.timedelta(hours=2),
            "reminders": [
                {"type": "popup", "minutes_before": 15},
                {"type": "email", "minutes_before": 60},
            ]
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
            start_time=now,
            end_time=now + datetime.timedelta(hours=1)
        )
        EventReminder.objects.create(event=event, type="popup", minutes_before=10)
        
        url = reverse("event-detail", args=[event.id])
        data = {
            "title": "New Title",
            "importance": 5,
            "start_time": now,
            "end_time": now + datetime.timedelta(hours=1),
            "reminders": [
                {"type": "email", "minutes_before": 20}
            ]
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
            importance=5,
            start_time=now,
            end_time=now + datetime.timedelta(hours=1)
        )
        EventReminder.objects.create(event=event, type="popup", minutes_before=10)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(len(response.data[0]["reminders"]), 1)
        self.assertEqual(response.data[0]["reminders"][0]["type"], "popup")
