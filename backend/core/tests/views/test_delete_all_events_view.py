"""Test cases for the delete all events view"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from datetime import datetime
from django.utils import timezone
from core.models import PendingShareEvent
from core.models import Event


class DeleteAllEventsViewTests(TestCase):
    """Test cases for delete all events view."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        """Test fail if not logged in."""
        response = self.client.delete("/api/delete_events/")
        self.assertEqual(response.status_code, 401)

    def test_success_if_logged_in(self):
        """Test success if logged in."""
        self.client.login(username="testuser", password="password")
        response = self.client.delete("/api/delete_events/")
        self.assertEqual(response.status_code, 200)

    def test_delete_0_events(self):
        """Test delete 0 events."""
        self.client.login(username="testuser", password="password")

        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(Event.objects.count(), 0)

        response = self.client.delete("/api/delete_events/")

        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(
            response.data["message"], "You do not have any events to delete"
        )
        self.assertEqual(response.status_code, 200)

    def test_delete_1_event(self):
        """Test delete 1 event."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(Event.objects.count(), 0)

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(Event.objects.count(), 1)

        response = self.client.delete("/api/delete_events/")

        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 1 events have been deleted")
        self.assertEqual(response.status_code, 200)

    def test_delete_2_events(self):
        """Test delete 2 events."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertFalse(Event.objects.filter(title="Title Event 2").exists())
        self.assertEqual(Event.objects.count(), 0)

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertTrue(Event.objects.filter(title="Title Event 2").exists())
        self.assertEqual(Event.objects.count(), 2)

        response = self.client.delete("/api/delete_events/")

        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertFalse(Event.objects.filter(title="Title Event 2").exists())
        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 2 events have been deleted")
        self.assertEqual(response.status_code, 200)

    def test_delete_3_events(self):
        """Test delete 3 events."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertFalse(Event.objects.filter(title="Title Event 2").exists())
        self.assertFalse(Event.objects.filter(title="Title Event 3").exists())
        self.assertEqual(Event.objects.count(), 0)

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 3",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertTrue(Event.objects.filter(title="Title Event 2").exists())
        self.assertTrue(Event.objects.filter(title="Title Event 3").exists())
        self.assertEqual(Event.objects.count(), 3)

        response = self.client.delete("/api/delete_events/")

        self.assertFalse(Event.objects.filter(title="Title Event 1").exists())
        self.assertFalse(Event.objects.filter(title="Title Event 2").exists())
        self.assertFalse(Event.objects.filter(title="Title Event 3").exists())
        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 3 events have been deleted")
        self.assertEqual(response.status_code, 200)

    # Delete -> Create objects with the same data -> Delete again
    # (IDs are different)
    def test_delete_create_delete_events(self):
        """Test delete create delete events."""
        self.client.login(username="testuser", password="password")
        self.assertEqual(Event.objects.count(), 0)

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertEqual(Event.objects.count(), 2)

        response = self.client.delete("/api/delete_events/")

        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 2 events have been deleted")
        self.assertEqual(response.status_code, 200)

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertEqual(Event.objects.count(), 2)

        response = self.client.delete("/api/delete_events/")

        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 2 events have been deleted")
        self.assertEqual(response.status_code, 200)

    # Test for  when the user is actively sharing an event with someoene
    def test_delete_events_while_pending_outgoing_share_request(self):
        """Test delete events while pending outgoing share request."""
        self.client.login(username="testuser", password="password")
        self.assertEqual(get_user_model().objects.count(), 1)

        # Sharing requires 2 accounts
        # User 1 will send an event to user 2
        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        self.assertEqual(get_user_model().objects.count(), 2)

        Event.objects.create(
            user=self.user,
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
        sharing = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "user2",
                "Event-ID": "e1",
            },
        )
        self.assertEqual(sharing.data["message"], "Event sent 1")
        self.assertEqual(PendingShareEvent.objects.count(), 1)

        # Now deleting

        response = self.client.delete("/api/delete_events/")

        self.assertEqual(Event.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 1 events have been deleted")
        self.assertEqual(response.status_code, 200)

        # Should be 0, as cascade is in effect, so deleting an event will also delete it being shared
        self.assertEqual(PendingShareEvent.objects.count(), 0)

    # Test for  when the user is actively sharing an event with someoene
    def test_delete_events_while_pending_incoming_share_request(self):
        """Test delete events while pending incoming share request."""
        self.client.login(username="testuser", password="password")
        self.assertEqual(get_user_model().objects.count(), 1)

        # Sharing requires 2 accounts
        # User 1 will send an event to user 2
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
        sharing = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "testuser",
                "Event-ID": "e1",
            },
        )
        self.assertEqual(sharing.data["message"], "Event sent 1")
        self.assertEqual(PendingShareEvent.objects.count(), 1)

        self.client.logout
        self.client.login(username="testuser", password="password")
        self.assertEqual(PendingShareEvent.objects.count(), 1)

        self.assertEqual(Event.objects.count(), 1)
        response = self.client.delete("/api/delete_events/")

        self.assertEqual(Event.objects.count(), 1)
        self.assertEqual(response.status_code, 200)
        # Share request should still exist as it does not belong to the user
        self.assertEqual(PendingShareEvent.objects.count(), 1)
