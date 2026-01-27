import datetime
from unittest.mock import Mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Task
from core.views.calendar_view import TaskViewSet


class TaskViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="viewuser",
            password="password123",
        )
        self.other_user = get_user_model().objects.create_user(
            username="otheruser",
            password="password123",
        )

    def test_task_list_filters_by_user_and_orders(self):
        today = timezone.now().date()
        Task.objects.create(
            user=self.user,
            task_message="First task",
            task_category=None,
            estimated_minutes=30,
            start_time=today + datetime.timedelta(days=1),
            completed=False,
            deadline=today + datetime.timedelta(days=10),
            importance=2,
        )
        earlier_task = Task.objects.create(
            user=self.user,
            task_message="Earlier task",
            task_category=None,
            estimated_minutes=45,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=5),
            importance=3,
        )
        Task.objects.create(
            user=self.other_user,
            task_message="Other user task",
            task_category=None,
            estimated_minutes=20,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=4),
            importance=1,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], earlier_task.id)

    def test_task_list_requires_authentication(self):
        response = self.client.get("/api/tasks/")

        self.assertIn(response.status_code, {401, 403})

    def test_perform_create_sets_user(self):
        viewset = TaskViewSet()
        serializer = Mock()

        viewset.request = Mock(user=self.user)
        viewset.perform_create(serializer)

        serializer.save.assert_called_once_with(user=self.user)
