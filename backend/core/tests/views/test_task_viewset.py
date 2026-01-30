import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Task, Category


class TaskViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="viewuser",
            password="password123",
            email="view@user.com"
        )
        self.other_user = get_user_model().objects.create_user(
            username="otheruser",
            password="password123",
            email="other@user.com"
        )
        self.category1 = Category.objects.create(text="Work")
        self.category2 = Category.objects.create(text="Home")

        self.now = timezone.now()

        # Create some tasks
        self.task1 = Task.objects.create(
            user=self.user,
            title="Task 1",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            completed=False,
            deadline=self.now + datetime.timedelta(days=10),
            importance=2,
        )
        self.task1.categories.add(self.category1)

        self.task2 = Task.objects.create(
            user=self.user,
            title="Task 2",
            estimated_minutes=45,
            start_time=self.now,
            completed=True,
            deadline=self.now + datetime.timedelta(days=5),
            importance=8,
        )
        self.task2.categories.add(self.category2)

    def test_task_list_filters_by_user(self):
        Task.objects.create(
            user=self.other_user,
            title="Other user task",
            estimated_minutes=20,
            start_time=self.now,
            completed=False,
            deadline=self.now + datetime.timedelta(days=4),
            importance=1,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_completed(self):
        self.client.force_authenticate(user=self.user)

        # Filter completed
        response = self.client.get("/api/tasks/?completed=true")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task2.id)

        # Filter incomplete
        response = self.client.get("/api/tasks/?completed=false")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_filter_by_category(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/tasks/?categories={self.category1.id}")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_ordering(self):
        self.client.force_authenticate(user=self.user)

        # Order by importance descending
        response = self.client.get("/api/tasks/?ordering=-importance")
        self.assertEqual(response.data[0]["id"], self.task2.id)  # 8 > 2

        # Order by importance ascending
        response = self.client.get("/api/tasks/?ordering=importance")
        self.assertEqual(response.data[0]["id"], self.task1.id)  # 2 < 8

    def test_filter_by_date_range(self):
        self.client.force_authenticate(user=self.user)

        # Filter by start_time__gte
        start_date = (self.now + datetime.timedelta(hours=12)).isoformat()
        import urllib.parse

        encoded_date = urllib.parse.quote(start_date)
        response = self.client.get(f"/api/tasks/?start_time__gte={encoded_date}")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_task_list_requires_authentication(self):
        response = self.client.get("/api/tasks/")
        self.assertIn(response.status_code, {401, 403})
