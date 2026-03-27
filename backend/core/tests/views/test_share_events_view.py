"""Tests for share events view."""

from datetime import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Event, PendingShareEvent


class ShareEventsViewTests(TestCase):
    """Test cases for share events view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        """Test fail if not logged in."""
        response = self.client.get("/api/share_events/")
        self.assertEqual(response.status_code, 401)

    def test_success_if_logged_in(self):
        """Test success if logged in."""
        self.client.login(username="testuser", password="password")
        response = self.client.get("/api/share_events/")
        self.assertEqual(response.status_code, 200)

    def test_return_0_objects(self):
        """Test return 0 objects."""
        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertEqual(Event.objects.count(), 1)
        self.assertEqual(PendingShareEvent.objects.count(), 0)

    def test_return_1_object(self):
        """Test return 1 object."""
        self.client.login(username="testuser", password="password")
        self.assertEqual(get_user_model().objects.count(), 1)

        # Sharing requires 2 accounts
        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        user2 = get_user_model().objects.get(username="user2")

        self.assertEqual(get_user_model().objects.count(), 2)

        self.client.logout()
        self.client.login(username="user2", password="password")

        Event.objects.create(
            user=user2,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(Event.objects.count(), 1)

        self.assertEqual(PendingShareEvent.objects.count(), 0)
        self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "testuser",
                "Event-ID": "e1",
            },
        )

        self.assertEqual(PendingShareEvent.objects.count(), 1)

        share_value = self.client.get(
            "/api/share_events/",
            data={
                "Receiver": "testuser",
            },
        )

        self.assertEqual(len(share_value.data), 1)

    def test_return_2_objects(self):
        """Test return 2 objects."""
        self.client.login(username="testuser", password="password")
        self.assertEqual(get_user_model().objects.count(), 1)

        # Sharing requires 2 accounts
        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        user2 = get_user_model().objects.get(username="user2")

        event1 = Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        event2 = Event.objects.create(
            user=user2,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        share_value = self.client.get(
            "/api/share_events/",
            data={
                "Receiver": "testuser",
            },
        )

        self.assertEqual(len(share_value.data), 0)

        PendingShareEvent.objects.create(
            sender=self.user,
            receiver=user2,
            event=event1,
        )

        PendingShareEvent.objects.create(
            sender=user2,
            receiver=self.user,
            event=event2,
        )

        share_value = self.client.get(
            "/api/share_events/",
            data={
                "Receiver": "testuser",
            },
        )

        self.assertEqual(len(share_value.data), 2)
