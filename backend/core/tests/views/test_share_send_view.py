from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from datetime import datetime
from django.utils import timezone
from core.models import Event


class ShareSendViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        response = self.client.get("/api/share_send/")
        self.assertEqual(response.status_code, 401)

    def test_no_data(self):
        self.client.login(username="testuser", password="password")
        response = self.client.post(
            "/api/share_send/",
            data={},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["message"], "Please provide a username and event ID"
        )

    def test_e_no_int(self):
        self.client.login(username="testuser", password="password")
        # Event ID is in the formant e123 -> ee is invalid
        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "123",
                "Event-ID": "ee",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["message"], "Please provide a valid username and event ID"
        )

    def test_no_e_no_int(self):
        self.client.login(username="testuser", password="password")
        # Event ID is in the formant e123 -> 1.5 is invalid
        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "123",
                "Event-ID": "1.5",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["message"], "Please provide a valid username and event ID"
        )

    def test_user_shares_event_they_do_not_own(self):
        self.client.login(username="testuser", password="password")

        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        user2 = get_user_model().objects.get(username="user2")

        Event.objects.create(
            user=user2,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "testuser",
                "Event-ID": "e2",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["message"], "Please provide an event ID that you own"
        )

    def test_recipient_does_not_exist(self):
        self.client.login(username="testuser", password="password")

        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
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

        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "testuserDOESNOTEXISTNOW",
                "Event-ID": "e1",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["message"], "Please provide a username that exists"
        )

    def test_recipient_already_has_the_same_event(self):
        self.client.login(username="testuser", password="password")

        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        user2 = get_user_model().objects.get(username="user2")

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
            user=user2,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "user2",
                "Event-ID": "e1",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Event sent 0")

    def test_request_already_exists(self):
        self.client.login(username="testuser", password="password")

        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        get_user_model().objects.get(username="user2")

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "user2",
                "Event-ID": "e1",
            },
        )

        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "user2",
                "Event-ID": "e1",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["message"],
            "You may not send more than 1 of the same event to the same person",
        )

    def test_successful_event_sent(self):
        self.client.login(username="testuser", password="password")

        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        get_user_model().objects.get(username="user2")

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2027, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        response = self.client.post(
            "/api/share_send/",
            data={
                "Receiver": "user2",
                "Event-ID": "e1",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Event sent 1")
