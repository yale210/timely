from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from notifications.models import BroadcastJob, BroadcastRecipient

User = get_user_model()


class AdminSendNotificationViewTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin", password="password", email="admin@test.com"
        )
        self.regular_user = User.objects.create_user(
            username="user", password="password", email="user@test.com"
        )
        self.url = reverse("admin-send-notification")

    def test_post_as_admin_success(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {"title": "Admin Note", "message": "Hello everyone", "target": "all"}
        with patch(
            "admin_panel.views.notification_actions.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-123"
            response = self.client.post(self.url, data)
            self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
            self.assertEqual(response.data["task_id"], "task-123")
            self.assertIn("broadcast_id", response.data)
            self.assertIn("queued_at", response.data)
            self.assertEqual(response.data["status"], BroadcastJob.Status.QUEUED)

    def test_post_as_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, {"title": "X", "message": "Y"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_missing_data(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, {"title": ""})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_invalid_target(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {"title": "Admin Note", "message": "Hello everyone", "target": "invalid"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "VALIDATION_FAILED")

    def test_post_users_target_without_user_ids(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {"title": "Admin Note", "message": "Hello users", "target": "users"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "VALIDATION_FAILED")

    def test_post_users_target_with_empty_user_ids(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "title": "Admin Note",
            "message": "Hello users",
            "target": "users",
            "user_ids": [],
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "VALIDATION_FAILED")

    def test_audience_counts(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/admin/audience_counts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("all", response.data)
        self.assertIn("staff", response.data)
        self.assertIn("admin", response.data)
        self.assertIn("selected_users", response.data)

    def test_broadcast_history_and_status_endpoints(self):
        self.client.force_authenticate(user=self.admin_user)
        with patch(
            "admin_panel.views.notification_actions.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-456"
            response = self.client.post(
                self.url,
                {"title": "History", "message": "Hello everyone", "target": "all"},
            )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        broadcast_id = response.data["broadcast_id"]

        list_response = self.client.get("/api/admin/broadcasts/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        detail_response = self.client.get(f"/api/admin/broadcasts/{broadcast_id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["id"], broadcast_id)

        status_response = self.client.get(
            f"/api/admin/broadcasts/{broadcast_id}/status/"
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data["id"], broadcast_id)

    def test_retry_failed_endpoint(self):
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
            status=BroadcastJob.Status.FAILED,
        )
        BroadcastRecipient.objects.create(
            broadcast_job=broadcast,
            recipient=self.regular_user,
            status=BroadcastRecipient.DeliveryStatus.FAILED,
            error_code="PUSH_PROVIDER_FAILURE",
            error_message="failed",
        )

        with patch(
            "admin_panel.views.notification_actions.process_broadcast_job.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-retry"
            response = self.client.post(
                f"/api/admin/broadcasts/{broadcast.id}/retry_failed/"
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data["status"], BroadcastJob.Status.QUEUED)
