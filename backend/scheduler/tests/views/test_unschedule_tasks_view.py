"""Tests for scheduler unschedule-tasks API behavior."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Task


class UnscheduleTasksAPIViewTests(APITestCase):
    """Test unschedule task API behavior."""

    def setUp(self):
        """Create an authenticated user and resolve the unschedule endpoint."""
        self.user = get_user_model().objects.create_user(
            username="scheduser", password="password123", email="sched@user.com"
        )
        self.client.force_authenticate(user=self.user)
        self.unschedule_url = reverse("unschedule-tasks")

    def test_unschedule_requires_auth(self):
        """Verify anonymous callers cannot unschedule tasks."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.unschedule_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unschedule_resets_allocation_without_mutating_task_window(self):
        """Verify unscheduling clears allocations but preserves task bounds."""
        now = timezone.now()
        original_start_time = now - timedelta(hours=2)
        original_deadline = now + timedelta(days=1)
        task = Task.objects.create(
            user=self.user,
            title="Unschedule me",
            description="",
            estimated_minutes=30,
            start_time=original_start_time,
            deadline=original_deadline,
            importance=5,
            completed=False,
            allocation=[
                {
                    "start": (now - timedelta(hours=2)).isoformat(),
                    "end": (now - timedelta(hours=1, minutes=30)).isoformat(),
                }
            ],
            total_task_allocations=1,
        )

        response = self.client.post(self.unschedule_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.allocation, [])
        self.assertEqual(task.total_task_allocations, 0)
        self.assertEqual(task.start_time, original_start_time)
        self.assertEqual(task.deadline, original_deadline)
