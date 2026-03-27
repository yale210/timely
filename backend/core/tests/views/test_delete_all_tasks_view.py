"""Test cases for the delete all tasks view."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from datetime import datetime
from django.utils import timezone
from core.models import Task


class DeleteAllTasksViewTests(TestCase):
    """Test cases for delete all tasks view."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        """Test fail if not logged in."""
        response = self.client.get("/api/export/")
        self.assertEqual(response.status_code, 401)

    def test_success_if_logged_in(self):
        """Test success if logged in."""
        self.client.login(username="testuser", password="password")
        response = self.client.get("/api/export/")
        self.assertEqual(response.status_code, 200)

    def test_delete_0_tasks(self):
        """Test delete 0 tasks."""
        self.client.login(username="testuser", password="password")

        self.assertEqual(Task.objects.count(), 0)

        response = self.client.delete("/api/delete_tasks/")

        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(
            response.data["message"], "You do not have any tasks to delete"
        )
        self.assertEqual(response.status_code, 200)

    def test_delete_1_task(self):
        """Test delete 1 task."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertEqual(Task.objects.count(), 0)

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        self.assertTrue(Task.objects.filter(title="Title Task 1").exists())
        self.assertEqual(Task.objects.count(), 1)

        response = self.client.delete("/api/delete_tasks/")

        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 1 tasks have been deleted")
        self.assertEqual(response.status_code, 200)

    def test_delete_2_tasks(self):
        """Test delete 2 tasks."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertEqual(Task.objects.count(), 0)

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        Task.objects.create(
            user=self.user,
            title="Title Task 2",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        self.assertTrue(Task.objects.filter(title="Title Task 1").exists())
        self.assertTrue(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 2)

        response = self.client.delete("/api/delete_tasks/")

        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertFalse(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 2 tasks have been deleted")
        self.assertEqual(response.status_code, 200)

    def test_delete_3_tasks(self):
        """Test delete 3 tasks."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertEqual(Task.objects.count(), 0)

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        Task.objects.create(
            user=self.user,
            title="Title Task 2",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        Task.objects.create(
            user=self.user,
            title="Title Task 3",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        self.assertTrue(Task.objects.filter(title="Title Task 1").exists())
        self.assertTrue(Task.objects.filter(title="Title Task 2").exists())
        self.assertTrue(Task.objects.filter(title="Title Task 3").exists())
        self.assertEqual(Task.objects.count(), 3)

        response = self.client.delete("/api/delete_tasks/")

        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertFalse(Task.objects.filter(title="Title Task 2").exists())
        self.assertFalse(Task.objects.filter(title="Title Task 3").exists())
        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 3 tasks have been deleted")
        self.assertEqual(response.status_code, 200)

    # Delete -> Create objects with the same data -> Delete again
    # (IDs are different)
    def test_delete_create_delete_tasks(self):
        """Test delete create delete tasks."""
        self.client.login(username="testuser", password="password")
        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertEqual(Task.objects.count(), 0)

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        Task.objects.create(
            user=self.user,
            title="Title Task 2",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        self.assertTrue(Task.objects.filter(title="Title Task 1").exists())
        self.assertTrue(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 2)

        response = self.client.delete("/api/delete_tasks/")

        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertFalse(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 2 tasks have been deleted")
        self.assertEqual(response.status_code, 200)

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        Task.objects.create(
            user=self.user,
            title="Title Task 2",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        self.assertTrue(Task.objects.filter(title="Title Task 1").exists())
        self.assertTrue(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 2)

        response = self.client.delete("/api/delete_tasks/")

        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertFalse(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(response.data["message"], "All 2 tasks have been deleted")
        self.assertEqual(response.status_code, 200)

    # Test to see see if the user can only delete their own tasks not the whole DB.
    def test_delete_tasks_is_local_to_user_only(self):
        """Test delete tasks is local to user only."""
        self.client.login(username="testuser", password="password")

        get_user_model().objects.create_user(
            username="user2", password="password", email="test2@user.com"
        )

        user2 = get_user_model().objects.get(username="user2")

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        Task.objects.create(
            user=user2,
            title="Title Task 2",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        # 2 tasks in DB - 1 for each of the 2 users
        self.assertEqual(Task.objects.count(), 2)

        response = self.client.delete("/api/delete_tasks/")

        # Deleting only the task owned by user 1 (Title Task 1)
        self.assertFalse(Task.objects.filter(title="Title Task 1").exists())
        self.assertTrue(Task.objects.filter(title="Title Task 2").exists())
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(response.status_code, 200)
