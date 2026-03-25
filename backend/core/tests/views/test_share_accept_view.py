from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from datetime import datetime
from django.utils import timezone
from core.models import PendingShareEvent
from core.models import Event


class ShareAcceptViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        response = self.client.get("/api/share_accept/")
        self.assertEqual(response.status_code, 401)

    def test_success_if_logged_in(self):
        self.client.login(username="testuser", password="password")
        response = self.client.post(
            "/api/share_accept/",
            data={"Event-ID": "1", "Decision": "accept"},
        )
        self.assertEqual(response.status_code, 200)

    def test_no_decision_nor_eventID(self):
        self.client.login(username="testuser", password="password")
        response = self.client.post(
            "/api/share_accept/",
            data={},
        )
        self.assertEqual(response.data["error"], "Event does not exist, likely deleted")

    def test_event_does_not_exist(self):
        self.client.login(username="testuser", password="password")
        response = self.client.post(
            "/api/share_accept/",
            data={
                "Event-ID": 70,
                "Decision": "accept",
            },
        )
        self.assertEqual(response.data["error"], "Event does not exist, likely deleted")
        self.assertEqual(PendingShareEvent.objects.count(), 0)

    def test_user_not_intended_recipient(self):
        self.client.login(username="testuser", password="password")

        # Sharing requires 2 accounts
        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        get_user_model().objects.create_user(
            username="user3", password="password", email="test3@user.com"
        )

        user2 = get_user_model().objects.get(username="user2")
        user3 = get_user_model().objects.get(username="user3")

        event2 = Event.objects.create(
            user=user2,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        PendingShareEvent.objects.create(
            sender=user2,
            receiver=user3,
            event=event2,
        )

        self.assertEqual(PendingShareEvent.objects.count(), 1)

        response = self.client.post(
            "/api/share_accept/",
            data={
                "Event-ID": 1,
                "Decision": "accept",
            },
        )
        self.assertEqual(response.data["error"], "This event is not shared with you")
        self.assertEqual(PendingShareEvent.objects.count(), 1)

    def test_accept_share(self):
        self.client.login(username="testuser", password="password")

        # Sharing requires 2 accounts
        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )
        user2 = get_user_model().objects.get(username="user2")

        event2 = Event.objects.create(
            user=user2,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        PendingShareEvent.objects.create(
            sender=user2,
            receiver=self.user,
            event=event2,
        )

        self.assertEqual(Event.objects.count(), 1)
        self.assertEqual(PendingShareEvent.objects.count(), 1)

        response = self.client.post(
            "/api/share_accept/",
            data={
                "Event-ID": 1,
                "Decision": "accept",
            },
        )
        self.assertEqual(response.data["message"], "This event has been accepted")
        self.assertEqual(PendingShareEvent.objects.count(), 0)
        self.assertEqual(Event.objects.count(), 2)

    def test_reject_share(self):
        self.client.login(username="testuser", password="password")

        # Sharing requires 2 accounts
        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )
        user2 = get_user_model().objects.get(username="user2")

        event2 = Event.objects.create(
            user=user2,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        PendingShareEvent.objects.create(
            sender=user2,
            receiver=self.user,
            event=event2,
        )

        self.assertEqual(Event.objects.count(), 1)
        self.assertEqual(PendingShareEvent.objects.count(), 1)

        response = self.client.post(
            "/api/share_accept/",
            data={
                "Event-ID": 1,
                "Decision": "reject",
            },
        )
        self.assertEqual(response.data["message"], "This event has been rejected")
        self.assertEqual(PendingShareEvent.objects.count(), 0)
        self.assertEqual(Event.objects.count(), 1)
