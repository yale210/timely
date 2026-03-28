"""Tests for share views."""

import datetime

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Event, PendingShareEvent, Task


class ShareSendViewTests(APITestCase):
    """Test cases for share send view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.sender = get_user_model().objects.create_user(
            username="sender", password="password123", email="sender@test.com"
        )
        self.receiver = get_user_model().objects.create_user(
            username="receiver", password="password123", email="receiver@test.com"
        )
        self.other_user = get_user_model().objects.create_user(
            username="other", password="password123", email="other@test.com"
        )
        self.url = "/api/share_send/"
        self.start_time = timezone.now() + datetime.timedelta(days=1)
        self.end_time = self.start_time + datetime.timedelta(hours=1)
        self.event = Event.objects.create(
            user=self.sender,
            title="Group Study",
            start_time=self.start_time,
            end_time=self.end_time,
        )

    def test_requires_authentication(self):
        """Test requires authentication."""
        response = self.client.post(self.url, {"Receiver": "receiver", "Event-ID": 1})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_missing_fields(self):
        """Test rejects missing fields."""
        self.client.force_authenticate(user=self.sender)

        response = self.client.post(
            self.url, {"Receiver": "receiver", "Event-ID": "   "}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"message": "Please provide a username and event ID"},
        )

    def test_rejects_invalid_event_id(self):
        """Test rejects invalid event id."""
        self.client.force_authenticate(user=self.sender)

        response = self.client.post(
            self.url,
            {"Receiver": self.receiver.username, "Event-ID": "enope"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"message": "Please provide a valid username and event ID"},
        )

    def test_rejects_event_not_owned_by_sender(self):
        """Test rejects event not owned by sender."""
        self.client.force_authenticate(user=self.sender)
        other_event = Event.objects.create(
            user=self.other_user,
            title="Other Event",
            start_time=self.start_time,
            end_time=self.end_time,
        )

        response = self.client.post(
            self.url,
            {"Receiver": self.receiver.username, "Event-ID": other_event.id},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"message": "Please provide an event ID that you own"},
        )

    def test_rejects_missing_receiver(self):
        """Test rejects missing receiver."""
        self.client.force_authenticate(user=self.sender)

        response = self.client.post(
            self.url,
            {"Receiver": "ghost", "Event-ID": self.event.id},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"message": "Please provide a username that exists"},
        )

    def test_returns_success_without_creating_duplicate_when_receiver_already_has_event(
        self,
    ):
        """Test returns success without creating duplicate when receiver already has event."""
        self.client.force_authenticate(user=self.sender)
        Event.objects.create(
            user=self.receiver,
            title=self.event.title,
            start_time=self.event.start_time,
            end_time=self.event.end_time,
        )

        response = self.client.post(
            self.url,
            {"Receiver": self.receiver.username, "Event-ID": f"e{self.event.id}"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "Event sent 0"})
        self.assertFalse(PendingShareEvent.objects.exists())

    def test_rejects_duplicate_pending_request(self):
        """Test rejects duplicate pending request."""
        self.client.force_authenticate(user=self.sender)
        PendingShareEvent.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            event=self.event,
        )

        response = self.client.post(
            self.url,
            {"Receiver": self.receiver.username, "Event-ID": self.event.id},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {
                "message": "You may not send more than 1 of the same event to the same person"
            },
        )

    def test_creates_pending_share_for_valid_request(self):
        """Test creates pending share for valid request."""
        self.client.force_authenticate(user=self.sender)

        response = self.client.post(
            self.url,
            {"Receiver": self.receiver.username, "Event-ID": f"e{self.event.id}"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "Event sent 1"})
        self.assertTrue(
            PendingShareEvent.objects.filter(
                sender=self.sender,
                receiver=self.receiver,
                event=self.event,
            ).exists()
        )


class ShareAcceptViewTests(APITestCase):
    """Test cases for share accept view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.sender = get_user_model().objects.create_user(
            username="sender", password="password123", email="sender@test.com"
        )
        self.receiver = get_user_model().objects.create_user(
            username="receiver", password="password123", email="receiver@test.com"
        )
        self.other_user = get_user_model().objects.create_user(
            username="other", password="password123", email="other@test.com"
        )
        self.url = "/api/share_accept/"
        self.start_time = timezone.now() + datetime.timedelta(days=2)
        self.end_time = self.start_time + datetime.timedelta(hours=2)
        self.event = Event.objects.create(
            user=self.sender,
            title="Shared Lecture",
            description="Review session",
            location="KCL",
            start_time=self.start_time,
            end_time=self.end_time,
        )
        self.pending_share = PendingShareEvent.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            event=self.event,
        )

    def test_requires_authentication(self):
        """Test requires authentication."""
        response = self.client.post(
            self.url,
            {"Decision": "accept", "Event-ID": self.event.id},
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_missing_decision(self):
        """Test rejects missing decision."""
        self.client.force_authenticate(user=self.receiver)

        response = self.client.post(self.url, {"Event-ID": self.event.id})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"error": "Please provide a decision and event ID"},
        )

    def test_rejects_missing_pending_event(self):
        """Test rejects missing pending event."""
        self.client.force_authenticate(user=self.receiver)

        response = self.client.post(self.url, {"Decision": "accept", "Event-ID": 99999})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"error": "Event does not exist, likely deleted"},
        )

    def test_rejects_wrong_recipient(self):
        """Test rejects wrong recipient."""
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(
            self.url,
            {"Decision": "accept", "Event-ID": self.event.id},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"error": "This event is not shared with you"})

    def test_accept_creates_event_copy_and_deletes_pending_share(self):
        """Test accept creates event copy and deletes pending share."""
        self.client.force_authenticate(user=self.receiver)

        response = self.client.post(
            self.url,
            {"Decision": "accept", "Event-ID": self.event.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "This event has been accepted"})
        self.assertFalse(
            PendingShareEvent.objects.filter(pk=self.pending_share.pk).exists()
        )

        copied_event = Event.objects.get(user=self.receiver, title=self.event.title)
        self.assertEqual(copied_event.description, self.event.description)
        self.assertEqual(copied_event.location, self.event.location)
        self.assertEqual(copied_event.start_time, self.event.start_time)
        self.assertEqual(copied_event.end_time, self.event.end_time)

    def test_reject_deletes_pending_share_without_creating_event(self):
        """Test reject deletes pending share without creating event."""
        self.client.force_authenticate(user=self.receiver)

        response = self.client.post(
            self.url,
            {"Decision": "reject", "Event-ID": self.event.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "This event has been rejected"})
        self.assertFalse(
            PendingShareEvent.objects.filter(pk=self.pending_share.pk).exists()
        )
        self.assertFalse(
            Event.objects.filter(user=self.receiver, title=self.event.title).exists()
        )


class ShareEventsViewTests(APITestCase):
    """Test cases for share events view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.sender = get_user_model().objects.create_user(
            username="sender", password="password123", email="sender@test.com"
        )
        self.receiver = get_user_model().objects.create_user(
            username="receiver", password="password123", email="receiver@test.com"
        )
        self.third_user = get_user_model().objects.create_user(
            username="third", password="password123", email="third@test.com"
        )
        self.url = "/api/share_events/"
        start_time = timezone.now() + datetime.timedelta(days=1)
        end_time = start_time + datetime.timedelta(hours=1)
        event_one = Event.objects.create(
            user=self.sender,
            title="Shared One",
            start_time=start_time,
            end_time=end_time,
        )
        event_two = Event.objects.create(
            user=self.third_user,
            title="Shared Two",
            start_time=start_time + datetime.timedelta(days=1),
            end_time=end_time + datetime.timedelta(days=1),
        )
        self.incoming_share = PendingShareEvent.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            event=event_one,
        )
        self.outgoing_share = PendingShareEvent.objects.create(
            sender=self.receiver,
            receiver=self.third_user,
            event=event_two,
        )
        PendingShareEvent.objects.create(
            sender=self.sender,
            receiver=self.third_user,
            event=event_one,
        )

    def test_requires_authentication(self):
        """Test requires authentication."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_lists_only_shares_related_to_current_user(self):
        """Test lists only shares related to current user."""
        self.client.force_authenticate(user=self.receiver)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        returned_ids = {item["id"] for item in response.data}
        self.assertSetEqual(
            returned_ids,
            {self.incoming_share.id, self.outgoing_share.id},
        )

        incoming = next(
            item for item in response.data if item["id"] == self.incoming_share.id
        )
        self.assertEqual(incoming["sender_username"], self.sender.username)
        self.assertEqual(incoming["receiver_username"], self.receiver.username)
        self.assertEqual(incoming["event_title"], "Shared One")


class DeleteAllDataViewTests(APITestCase):
    """Test cases for delete all data view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="cleanup", password="password123", email="cleanup@test.com"
        )
        self.other_user = get_user_model().objects.create_user(
            username="other", password="password123", email="other@test.com"
        )
        self.delete_events_url = "/api/delete_events/"
        self.delete_tasks_url = "/api/delete_tasks/"
        self.start_time = timezone.now() + datetime.timedelta(days=1)

    def test_delete_events_requires_authentication(self):
        """Test delete events requires authentication."""
        response = self.client.delete(self.delete_events_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_events_removes_only_current_users_events(self):
        """Test delete events removes only current users events."""
        self.client.force_authenticate(user=self.user)
        Event.objects.create(
            user=self.user,
            title="First",
            start_time=self.start_time,
            end_time=self.start_time + datetime.timedelta(hours=1),
        )
        Event.objects.create(
            user=self.user,
            title="Second",
            start_time=self.start_time + datetime.timedelta(days=1),
            end_time=self.start_time + datetime.timedelta(days=1, hours=1),
        )
        Event.objects.create(
            user=self.other_user,
            title="Other User Event",
            start_time=self.start_time,
            end_time=self.start_time + datetime.timedelta(hours=1),
        )

        response = self.client.delete(self.delete_events_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "All 2 events have been deleted"})
        self.assertEqual(Event.objects.filter(user=self.user).count(), 0)
        self.assertEqual(Event.objects.filter(user=self.other_user).count(), 1)

    def test_delete_events_handles_empty_calendar(self):
        """Test delete events handles empty calendar."""
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.delete_events_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"message": "You do not have any events to delete"}
        )

    def test_delete_tasks_requires_authentication(self):
        """Test delete tasks requires authentication."""
        response = self.client.delete(self.delete_tasks_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_tasks_removes_only_current_users_tasks(self):
        """Test delete tasks removes only current users tasks."""
        self.client.force_authenticate(user=self.user)

        Task.objects.create(
            user=self.user,
            title="First Task",
            estimated_minutes=30,
            start_time=self.start_time,
            deadline=self.start_time + datetime.timedelta(hours=2),
            importance=1,
        )
        Task.objects.create(
            user=self.user,
            title="Second Task",
            estimated_minutes=45,
            start_time=self.start_time + datetime.timedelta(days=1),
            deadline=self.start_time + datetime.timedelta(days=1, hours=2),
            importance=2,
        )
        Task.objects.create(
            user=self.other_user,
            title="Other Task",
            estimated_minutes=15,
            start_time=self.start_time,
            deadline=self.start_time + datetime.timedelta(hours=1),
            importance=1,
        )

        response = self.client.delete(self.delete_tasks_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "All 2 tasks have been deleted"})
        self.assertEqual(Task.objects.filter(user=self.user).count(), 0)
        self.assertEqual(Task.objects.filter(user=self.other_user).count(), 1)

    def test_delete_tasks_handles_empty_task_list(self):
        """Test delete tasks handles empty task list."""
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.delete_tasks_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"message": "You do not have any tasks to delete"}
        )
