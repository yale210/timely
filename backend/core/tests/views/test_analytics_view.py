from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model


class WeeklySummaryViewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester", password="pwd", email="test@test.com"
        )
        self.url = reverse("weekly-summary")

    @patch("core.views.analytics_view.calculate_weekly_stats")
    def test_get_summary_authenticated_success(self, mock_stats):
        mock_stats.return_value = {
            "total_tasks": 5,
            "completed_tasks": 2,
            "completion_percentage": 40.0,
            "total_minutes_planned": 100,
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_tasks"], 5)
        self.assertEqual(response.data["completion_percentage"], 40.0)

    def test_get_summary_unauthenticated_forbidden(self):
        response = self.client.get(self.url)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )
