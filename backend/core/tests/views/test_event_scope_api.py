from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Event, EventOverride


class EventScopeApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="event-scope-user",
            email="event-scope@example.com",
            password="password123",
        )
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse("event-list")
        self.start = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.recurring_event = Event.objects.create(
            user=self.user,
            title="Recurring Class",
            start_time=self.start,
            end_time=self.start + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(self.start + timedelta(days=3)).date(),
        )

    def test_list_returns_flattened_metadata(self):
        response = self.client.get(
            self.list_url,
            {
                "start_date": self.start.date().isoformat(),
                "end_date": (self.start + timedelta(days=2)).date().isoformat(),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        first = response.data[0]
        self.assertIn("is_override", first)
        self.assertIn("source_event_id", first)
        self.assertIn("instance_id", first)
        self.assertIn("is_split_series", first)
        self.assertIn("split_from_event_id", first)
        self.assertEqual(first["source_event_id"], self.recurring_event.id)

    def test_list_rejects_excessive_date_window(self):
        response = self.client.get(
            self.list_url,
            {"start_date": "2026-01-01", "end_date": "2027-12-31"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_scope_update_this_requires_original_start_time(self):
        detail_url = reverse("event-detail", args=[self.recurring_event.id])
        response = self.client.patch(
            f"{detail_url}?scope=this",
            {"title": "Edited"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_scope_update_this_creates_override(self):
        original = self.start + timedelta(days=1)
        detail_url = reverse("event-detail", args=[self.recurring_event.id])
        response = self.client.patch(
            f"{detail_url}?scope=this&original_start_time={original.isoformat()}",
            {"title": "Edited Once"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            EventOverride.objects.filter(
                parent_event=self.recurring_event,
                original_start_time=original,
            ).exists()
        )
        self.recurring_event.refresh_from_db()
        self.assertIn(original.date().isoformat(), self.recurring_event.exception_dates)

    def test_scope_update_this_rejects_recurrence_pattern_change(self):
        original = self.start + timedelta(days=1)
        detail_url = reverse("event-detail", args=[self.recurring_event.id])
        response = self.client.patch(
            f"{detail_url}?scope=this&original_start_time={original.isoformat()}",
            {"recurrence_interval": Event.RecurrenceInterval.WEEKLY},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Recurrence pattern changes", response.data["detail"])

    def test_scope_update_all_preserves_prior_occurrences(self):
        anchor = self.start + timedelta(days=2)
        detail_url = reverse("event-detail", args=[self.recurring_event.id])
        response = self.client.patch(
            f"{detail_url}?scope=all&original_start_time={anchor.isoformat()}",
            {
                "title": "All Updated",
                "description": "",
                "location": "",
                "start_time": anchor.isoformat(),
                "end_time": (anchor + timedelta(hours=1)).isoformat(),
                "recurrence_interval": Event.RecurrenceInterval.DAILY,
                "recurrence_end": self.recurring_event.recurrence_end.isoformat(),
                "categories": [],
                "reminders": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.recurring_event.refresh_from_db()
        self.assertEqual(self.recurring_event.start_time.date(), self.start.date())

        list_response = self.client.get(
            self.list_url,
            {
                "start_date": self.start.date().isoformat(),
                "end_date": (self.start + timedelta(days=2)).date().isoformat(),
            },
        )
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn(
            self.start.date().isoformat(),
            [row["start_time"][:10] for row in list_response.data],
        )

    def test_scope_update_following_preserves_prior_occurrences(self):
        anchor = self.start + timedelta(days=2)
        detail_url = reverse("event-detail", args=[self.recurring_event.id])
        response = self.client.patch(
            f"{detail_url}?scope=following&original_start_time={anchor.isoformat()}",
            {
                "title": "Following Updated",
                "description": "",
                "location": "",
                "start_time": anchor.isoformat(),
                "end_time": (anchor + timedelta(hours=1)).isoformat(),
                "recurrence_interval": Event.RecurrenceInterval.DAILY,
                "recurrence_end": self.recurring_event.recurrence_end.isoformat(),
                "categories": [],
                "reminders": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        list_response = self.client.get(
            self.list_url,
            {
                "start_date": self.start.date().isoformat(),
                "end_date": (self.start + timedelta(days=2)).date().isoformat(),
            },
        )
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn(
            self.start.date().isoformat(),
            [row["start_time"][:10] for row in list_response.data],
        )

    def test_revert_instance_removes_override_and_exception_date(self):
        original = self.start + timedelta(days=1)
        EventOverride.objects.create(
            parent_event=self.recurring_event,
            original_start_time=original,
            title="Edited Once",
            description="",
            location="",
            start_time=original + timedelta(hours=2),
            end_time=original + timedelta(hours=3),
        )
        self.recurring_event.exception_dates = [original.date().isoformat()]
        self.recurring_event.save(update_fields=["exception_dates"])

        revert_url = reverse("event-revert-instance", args=[self.recurring_event.id])
        response = self.client.post(
            f"{revert_url}?original_start_time={original.isoformat()}",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            EventOverride.objects.filter(
                parent_event=self.recurring_event,
                original_start_time=original,
            ).exists()
        )
        self.recurring_event.refresh_from_db()
        self.assertNotIn(
            original.date().isoformat(), self.recurring_event.exception_dates
        )

    def test_revert_instance_requires_original_start_time(self):
        revert_url = reverse("event-revert-instance", args=[self.recurring_event.id])
        response = self.client.post(revert_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=False)
    def test_scope_update_rejected_when_feature_flag_disabled(self):
        original = self.start + timedelta(days=1)
        detail_url = reverse("event-detail", args=[self.recurring_event.id])
        response = self.client.patch(
            f"{detail_url}?scope=this&original_start_time={original.isoformat()}",
            {"title": "Edited Once"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(ENABLE_RECURRENCE_OVERRIDES=False)
    def test_revert_instance_rejected_when_feature_flag_disabled(self):
        original = self.start + timedelta(days=1)
        revert_url = reverse("event-revert-instance", args=[self.recurring_event.id])
        response = self.client.post(
            f"{revert_url}?original_start_time={original.isoformat()}",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
