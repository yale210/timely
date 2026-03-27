"""Tests for admin notification send and audience endpoints."""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import BroadcastAuditLog, BroadcastJob, BroadcastRecipient

User = get_user_model()


class AdminNotificationActionTests(APITestCase):
    """Test admin notification action endpoints."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@test.com",
        )
        cls.staff_user = User.objects.create_user(
            username="staff",
            password="password",
            email="staff@test.com",
        )
        cls.staff_user.is_staff = True
        cls.staff_user.save(update_fields=["is_staff"])
        cls.regular_user = User.objects.create_user(
            username="regular",
            password="password",
            email="regular@test.com",
        )
        cls.inactive_user = User.objects.create_user(
            username="inactive",
            password="password",
            email="inactive@test.com",
        )
        cls.inactive_user.is_active = False
        cls.inactive_user.save(update_fields=["is_active"])
    def setUp(self):
        """Create users and route paths for notification action tests."""
        self.send_url = reverse("admin-send-notification")
        self.audience_counts_url = reverse("admin-audience-counts")

    def test_regular_user_cannot_send_notifications(self):
        """Verify non-admin users cannot trigger broadcast sends."""
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.post(
            self.send_url,
            {"title": "Admin note", "message": "Hello everyone", "target": "all"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_send_notification_creates_broadcast_and_recipients_for_all_users(self):
        """Verify sending to all users creates the expected broadcast records."""
        self.client.force_authenticate(user=self.admin_user)

        with patch(
            "admin_panel.views.notification_actions_view.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-all"
            response = self.client.post(
                self.send_url,
                {
                    "title": "Admin note",
                    "message": "Hello everyone",
                    "target": "all",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        broadcast = BroadcastJob.objects.get(id=response.data["broadcast_id"])
        recipient_ids = set(
            BroadcastRecipient.objects.filter(broadcast_job=broadcast).values_list(
                "recipient_id", flat=True
            )
        )
        self.assertEqual(response.data["task_id"], "task-all")
        self.assertEqual(broadcast.status, BroadcastJob.Status.QUEUED)
        self.assertEqual(broadcast.recipient_count, 3)
        self.assertEqual(
            recipient_ids,
            {self.admin_user.id, self.staff_user.id, self.regular_user.id},
        )
        self.assertTrue(
            BroadcastAuditLog.objects.filter(
                broadcast_job=broadcast,
                action=BroadcastAuditLog.Action.SEND,
            ).exists()
        )

    def test_send_notification_returns_validation_error_for_invalid_target(self):
        """Verify invalid targets return a validation error payload."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.send_url,
            {
                "title": "Admin note",
                "message": "Hello everyone",
                "target": "invalid",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "VALIDATION_FAILED")

    def test_send_notification_to_selected_users_only_targets_active_matches(self):
        """Verify targeted sends only include active requested users."""
        self.client.force_authenticate(user=self.admin_user)

        with patch(
            "admin_panel.views.notification_actions_view.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-users"
            response = self.client.post(
                self.send_url,
                {
                    "title": "Admin note",
                    "message": "Hello selected users",
                    "target": "users",
                    "user_ids": [
                        self.staff_user.id,
                        self.regular_user.id,
                        self.inactive_user.id,
                    ],
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        broadcast = BroadcastJob.objects.get(id=response.data["broadcast_id"])
        recipient_ids = set(
            BroadcastRecipient.objects.filter(broadcast_job=broadcast).values_list(
                "recipient_id", flat=True
            )
        )
        self.assertEqual(broadcast.recipient_count, 2)
        self.assertEqual(recipient_ids, {self.staff_user.id, self.regular_user.id})

    def test_send_notification_returns_zero_audience_for_inactive_selected_users(self):
        """Verify targeted sends fail when no active recipients are matched."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.send_url,
            {
                "title": "Admin note",
                "message": "Hello inactive users",
                "target": "users",
                "user_ids": [self.inactive_user.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "ZERO_AUDIENCE")

    def test_send_notification_to_staff_targets_staff_users(self):
        """Verify targeted sends to staff only include active staff users."""
        self.client.force_authenticate(user=self.admin_user)

        with patch(
            "admin_panel.views.notification_actions_view.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-staff"
            response = self.client.post(
                self.send_url,
                {
                    "title": "Staff note",
                    "message": "Hello staff",
                    "target": "staff",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        broadcast = BroadcastJob.objects.get(id=response.data["broadcast_id"])
        recipient_ids = set(
            BroadcastRecipient.objects.filter(broadcast_job=broadcast).values_list(
                "recipient_id", flat=True
            )
        )
        self.assertEqual(broadcast.recipient_count, 2)
        # Admin is also staff by default in create_superuser
        self.assertEqual(recipient_ids, {self.admin_user.id, self.staff_user.id})

    def test_send_notification_to_admins_targets_admin_users(self):
        """Verify targeted sends to admins only include active superusers."""
        self.client.force_authenticate(user=self.admin_user)

        with patch(
            "admin_panel.views.notification_actions_view.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-admin"
            response = self.client.post(
                self.send_url,
                {
                    "title": "Admin note",
                    "message": "Hello admins",
                    "target": "admin",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        broadcast = BroadcastJob.objects.get(id=response.data["broadcast_id"])
        recipient_ids = set(
            BroadcastRecipient.objects.filter(broadcast_job=broadcast).values_list(
                "recipient_id", flat=True
            )
        )
        self.assertEqual(broadcast.recipient_count, 1)
        self.assertEqual(recipient_ids, {self.admin_user.id})

    def test_audience_counts_without_user_ids(self):
        """Verify audience counts work without providing specific user IDs."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.audience_counts_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["selected_users"], 0)

    def test_audience_counts_returns_expected_active_totals(self):
        """Verify audience count data only includes active matching users."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(
            f"{self.audience_counts_url}?user_ids="
            f"{self.regular_user.id},{self.inactive_user.id},{self.staff_user.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["all"], 3)
        self.assertEqual(response.data["staff"], 2)
        self.assertEqual(response.data["admin"], 1)
        self.assertEqual(response.data["selected_users"], 2)
