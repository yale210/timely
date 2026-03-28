"""Tests for event viewset."""

import datetime
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Event, EventReminder


class EventViewSetTests(APITestCase):
    """Test cases for event view set."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("event-list")

    def test_create_event_with_reminders(self):
        now = timezone.now()
        data = {
            "title": "API Event",
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
            start_time=now + datetime.timedelta(hours=3),
            end_time=now + datetime.timedelta(hours=4),
        )
        EventReminder.objects.create(event=event, send_push=True, minutes_before=10)

        url = reverse("event-detail", args=[event.id])
        data = {
            "title": "New Title",
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
        now = timezone.now()
        data = {
            "title": "Event with 5 reminders",
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
        now = timezone.now()
        data = {
            "title": "Event with too many reminders",
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

    def test_server_time_endpoint(self):
        url = reverse("event-server-time")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("server_time", response.data)
        self.assertIsNotNone(
            datetime.datetime.fromisoformat(response.data["server_time"])
        )

    def test_list_with_invalid_dates(self):
        response = self.client.get(
            self.url, {"start_date": "2023-01-01", "end_date": "invalid"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(
            self.url, {"start_date": "2023-01-02", "end_date": "2023-01-01"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(
            self.url, {"start_date": "2023-01-01", "end_date": "2024-01-02"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_parse_original_start_time_invalid(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring Event",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])

        response = self.client.patch(
            url, {"title": "New"}, QUERY_STRING="original_start_time=invalid"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.patch(
            url,
            {"title": "New"},
            QUERY_STRING="original_start_time=2023-01-01T10:00:00",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_with_invalid_scope(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Event",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        url = reverse("event-detail", args=[event.id])
        response = self.client.patch(
            url, {"title": "New"}, QUERY_STRING="scope=invalid"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    from django.test import override_settings

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=False)
    def test_update_recurring_scope_disabled(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        response = self.client.patch(
            url,
            {"title": "New"},
            QUERY_STRING="scope=this&original_start_time=2023-01-01T10:00:00Z",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("disabled by feature flag", response.data["detail"])

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=False)
    def test_destroy_recurring_scope_disabled(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        response = self.client.delete(
            url, QUERY_STRING="scope=this&original_start_time=2023-01-01T10:00:00Z"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("disabled by feature flag", response.data["detail"])

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_update_recurring_missing_original_start_time(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        response = self.client.patch(url, {"title": "New"}, QUERY_STRING="scope=this")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("original_start_time is required", response.data["detail"])

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_revert_instance_success(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )

        url = reverse("event-revert-instance", args=[event.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        from unittest.mock import patch

        with patch("core.views.event_view.revert_override_instance") as mock_revert:
            response = self.client.post(
                url, QUERY_STRING="original_start_time=2023-01-01T10:00:00Z"
            )
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
            mock_revert.assert_called_once()

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=False)
    def test_revert_instance_disabled(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-revert-instance", args=[event.id])
        response = self.client.post(
            url, QUERY_STRING="original_start_time=2023-01-01T10:00:00Z"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("disabled by feature flag", response.data["detail"])

    def test_revert_instance_non_recurring(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Non-recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        url = reverse("event-revert-instance", args=[event.id])
        response = self.client.post(
            url, QUERY_STRING="original_start_time=2023-01-01T10:00:00Z"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only recurring events support", response.data["detail"])

    def test_list_no_dates(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_update_recurring_success(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        from unittest.mock import patch

        with patch("core.views.event_view.apply_update_scope") as mock_update:
            mock_update.return_value = event
            response = self.client.patch(
                url,
                {"title": "Updated"},
                QUERY_STRING="scope=this&original_start_time=2023-01-01T10:00:00Z",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            mock_update.assert_called_once()

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_update_recurring_value_error(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        from unittest.mock import patch

        with patch("core.views.event_view.apply_update_scope") as mock_update:
            mock_update.side_effect = ValueError("Test error")
            response = self.client.patch(
                url,
                {"title": "Updated"},
                QUERY_STRING="scope=this&original_start_time=2023-01-01T10:00:00Z",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.data["detail"], "Test error")

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_destroy_recurring_all_scope(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        response = self.client.delete(url, QUERY_STRING="scope=all")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Event.objects.count(), 0)

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_destroy_recurring_this_scope(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-detail", args=[event.id])
        from unittest.mock import patch

        with patch("core.views.event_view.apply_delete_scope") as mock_delete:
            response = self.client.delete(
                url, QUERY_STRING="scope=this&original_start_time=2023-01-01T10:00:00Z"
            )
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
            mock_delete.assert_called_once()

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=True)
    def test_revert_instance_value_error(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval="daily",
        )
        url = reverse("event-revert-instance", args=[event.id])
        from unittest.mock import patch

        with patch("core.views.event_view.revert_override_instance") as mock_revert:
            mock_revert.side_effect = ValueError("Not found")
            response = self.client.post(
                url, QUERY_STRING="original_start_time=2023-01-01T10:00:00Z"
            )
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_destroy_non_recurring(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Non-recurring",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        url = reverse("event-detail", args=[event.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Event.objects.count(), 0)
