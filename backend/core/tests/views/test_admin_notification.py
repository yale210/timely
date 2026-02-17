from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch

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
            "core.views.admin_notification_view.broadcast_notification.delay"
        ) as mock_task:
            mock_task.return_value.id = "task-123"
            response = self.client.post(self.url, data)
            self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
            self.assertEqual(response.data["task_id"], "task-123")

    def test_post_as_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, {"title": "X", "message": "Y"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_missing_data(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, {"title": ""})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
