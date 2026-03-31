"""Tests for admin broadcast management endpoints."""

from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import BroadcastAuditLog, BroadcastJob, BroadcastRecipient

User = get_user_model()


class AdminBroadcastActionTests(APITestCase):
    """Test broadcast history, detail, status, and retry endpoints."""

    def setUp(self):
        """Create users and route helpers for broadcast endpoint tests."""
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@test.com",
        )
        self.staff_user = User.objects.create_user(
            username="staff",
            password="password",
            email="staff@test.com",
        )
        self.staff_user.is_staff = True
        self.staff_user.save(update_fields=["is_staff"])
        self.regular_user = User.objects.create_user(
            username="regular",
            password="password",
            email="regular@test.com",
        )

        self.broadcasts_url = "/api/admin/broadcasts/"

    def _broadcast_detail_url(self, broadcast_id):
        """Build the broadcast detail endpoint URL."""
        return f"/api/admin/broadcasts/{broadcast_id}/"

    def _broadcast_recipients_url(self, broadcast_id):
        """Build the broadcast recipients endpoint URL."""
        return f"/api/admin/broadcasts/{broadcast_id}/recipients/"

    def _broadcast_status_url(self, broadcast_id):
        """Build the broadcast status endpoint URL."""
        return f"/api/admin/broadcasts/{broadcast_id}/status/"

    def _retry_failed_url(self, broadcast_id):
        """Build the retry-failed endpoint URL."""
        return f"/api/admin/broadcasts/{broadcast_id}/retry_failed/"

    def test_broadcasts_filters_by_query_only(self):
        """Verify broadcast list can be filtered by title query alone."""
        self.client.force_authenticate(user=self.admin_user)
        BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Important alert",
            message="Alert",
            target="all",
        )

        response = self.client.get(f"{self.broadcasts_url}?q=Important")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if "results" in response.data:
            self.assertEqual(len(response.data["results"]), 1)
            self.assertEqual(response.data["results"][0]["title"], "Important alert")
        else:
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]["title"], "Important alert")

    def test_broadcast_status_returns_not_found_for_missing_broadcast(self):
        """Verify broadcast status returns a not-found payload for invalid IDs."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self._broadcast_status_url(999999))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"]["code"], "NOT_FOUND")

    def test_retry_failed_returns_not_found_for_missing_broadcast(self):
        """Verify retrying failed recipients returns not-found for invalid IDs."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(self._retry_failed_url(999999), format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"]["code"], "NOT_FOUND")

    def test_broadcasts_endpoint_filters_by_target_status_and_query(self):
        """Verify broadcast list filters are applied together."""
        self.client.force_authenticate(user=self.admin_user)
        matching_job = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Release announcement",
            message="Release completed.",
            target=BroadcastJob.Target.STAFF,
            status=BroadcastJob.Status.COMPLETED,
        )
        BroadcastJob.objects.create(
            sender=self.admin_user,
            title="General update",
            message="General message.",
            target=BroadcastJob.Target.ALL,
            status=BroadcastJob.Status.QUEUED,
        )

        response = self.client.get(
            f"{self.broadcasts_url}?target=staff&status=COMPLETED&q=Release"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], matching_job.id)

    def test_broadcast_detail_returns_nested_recipient_data(self):
        """Verify broadcast detail returns nested recipient information."""
        self.client.force_authenticate(user=self.admin_user)
        broadcast = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Release announcement",
            message="Release completed.",
            target=BroadcastJob.Target.ALL,
        )
        BroadcastRecipient.objects.create(
            broadcast_job=broadcast,
            recipient=self.regular_user,
            status=BroadcastRecipient.DeliveryStatus.SENT,
        )

        response = self.client.get(self._broadcast_detail_url(broadcast.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], broadcast.id)
        self.assertNotIn("recipients", response.data)

        recipients_response = self.client.get(
            self._broadcast_recipients_url(broadcast.id)
        )

        self.assertEqual(recipients_response.status_code, status.HTTP_200_OK)
        self.assertEqual(recipients_response.data["count"], 1)
        self.assertEqual(
            recipients_response.data["results"][0]["username"], "regular"
        )

    def test_broadcast_detail_returns_not_found_for_missing_broadcast(self):
        """Verify missing broadcasts return a not-found payload."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self._broadcast_detail_url(999999))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"]["code"], "NOT_FOUND")

    def test_broadcast_status_returns_summary_fields(self):
        """Verify broadcast status returns the expected summary fields."""
        self.client.force_authenticate(user=self.admin_user)
        started_at = timezone.now()
        completed_at = started_at + timedelta(minutes=5)
        broadcast = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Release announcement",
            message="Release completed.",
            target=BroadcastJob.Target.ALL,
            status=BroadcastJob.Status.PARTIAL,
            recipient_count=3,
            delivered_count=2,
            failed_count=1,
            task_id="task-status",
            started_at=started_at,
            completed_at=completed_at,
        )

        response = self.client.get(self._broadcast_status_url(broadcast.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], broadcast.id)
        self.assertEqual(response.data["status"], BroadcastJob.Status.PARTIAL)
        self.assertEqual(response.data["recipient_count"], 3)
        self.assertEqual(response.data["delivered_count"], 2)
        self.assertEqual(response.data["failed_count"], 1)
        self.assertEqual(response.data["task_id"], "task-status")
        self.assertIsNotNone(response.data["updated_at"])

    def test_retry_failed_creates_retry_job_for_failed_recipients_only(self):
        """Verify retrying failed recipients creates a retry broadcast job."""
        self.client.force_authenticate(user=self.admin_user)
        broadcast = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Original",
            message="payload",
            target=BroadcastJob.Target.ALL,
            audience_filters={"target": "all"},
            audience_snapshot={
                "recipient_ids": [self.staff_user.id, self.regular_user.id],
                "recipient_count": 2,
            },
            recipient_count=2,
            status=BroadcastJob.Status.FAILED,
        )
        BroadcastRecipient.objects.create(
            broadcast_job=broadcast,
            recipient=self.regular_user,
            status=BroadcastRecipient.DeliveryStatus.FAILED,
            error_code="PUSH_PROVIDER_FAILURE",
            error_message="failed",
        )
        BroadcastRecipient.objects.create(
            broadcast_job=broadcast,
            recipient=self.staff_user,
            status=BroadcastRecipient.DeliveryStatus.SENT,
        )

        with patch(
            "admin_panel.views.notification_actions_view.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-retry"
            response = self.client.post(
                self._retry_failed_url(broadcast.id),
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        retry_job = BroadcastJob.objects.exclude(id=broadcast.id).get()
        retry_recipient_ids = set(
            BroadcastRecipient.objects.filter(broadcast_job=retry_job).values_list(
                "recipient_id", flat=True
            )
        )
        self.assertEqual(response.data["task_id"], "task-retry")
        self.assertEqual(retry_job.target, BroadcastJob.Target.RETRY_FAILED)
        self.assertEqual(retry_job.retry_of_id, broadcast.id)
        self.assertEqual(retry_job.recipient_count, 1)
        self.assertEqual(retry_recipient_ids, {self.regular_user.id})
        self.assertTrue(
            BroadcastAuditLog.objects.filter(
                broadcast_job=retry_job,
                action=BroadcastAuditLog.Action.RETRY,
            ).exists()
        )

    def test_retry_failed_returns_zero_audience_without_failed_recipients(self):
        """Verify retrying without failed recipients returns a zero-audience error."""
        self.client.force_authenticate(user=self.admin_user)
        broadcast = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Original",
            message="payload",
            target=BroadcastJob.Target.ALL,
            audience_filters={"target": "all"},
            audience_snapshot={
                "recipient_ids": [self.regular_user.id],
                "recipient_count": 1,
            },
            recipient_count=1,
            status=BroadcastJob.Status.COMPLETED,
        )
        BroadcastRecipient.objects.create(
            broadcast_job=broadcast,
            recipient=self.regular_user,
            status=BroadcastRecipient.DeliveryStatus.SENT,
        )

        response = self.client.post(self._retry_failed_url(broadcast.id), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "ZERO_AUDIENCE")
