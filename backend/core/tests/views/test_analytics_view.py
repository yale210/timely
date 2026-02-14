from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime

from core.models.task import Task


class WeeklySummaryViewTests(APITestCase):
    """Tests for the weekly summary API view and date parsing."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="tester", password="pwd", email="test@test.com")
        self.url = reverse("weekly-summary")

    def _create_test_task(self, **kwargs):
        defaults = {
            "user": self.user,
            "title": "task",
            "estimated_minutes": 10,
            "importance": 5,
            "start_time": timezone.now(),
            "deadline": timezone.now() + timezone.timedelta(hours=1),
        }
        defaults.update(kwargs)
        return Task.objects.create(**defaults)

    def test_get_summary_with_valid_date_param(self):
        """Providing a valid YYYY-MM-DD date returns a 200 and stats."""
        # choose 2026-02-14 (Saturday) and create a task in that week
        date_str = "2026-02-14"
        parsed = datetime.strptime(date_str, "%Y-%m-%d").date()
        now_dt = timezone.make_aware(datetime.combine(parsed, datetime.min.time()))
        # create task inside that week
        self._create_test_task(start_time=now_dt + timezone.timedelta(days=1, hours=2), deadline=now_dt + timezone.timedelta(days=1, hours=3))
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(f"{self.url}?date={date_str}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_get_summary_with_invalid_date_param(self):
        """Invalid date formats should not crash the view and still return 200."""
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(f"{self.url}?date=14-02-2026")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_get_summary_with_empty_date_param(self):
        """Empty date parameter should be treated as omitted (200)."""
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(f"{self.url}?date=")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
