import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from core.models import Task, Category


class TaskTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )
        self.category1 = Category.objects.create(text="Work")
        self.category2 = Category.objects.create(text="Personal")

    def test_task_calculate_time_left_is_overdue_returns_zero(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Overdue task",
            estimated_minutes=45,
            start_time=now,
            completed=False,
            deadline=now - datetime.timedelta(days=10),
            importance=10,
        )

        self.assertEqual(task.calculate_time_left(), 0)

    def test_task_calculate_time_left_deadline(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Deadline task",
            estimated_minutes=45,
            start_time=now,
            completed=False,
            deadline=now + datetime.timedelta(days=5),
            importance=7,
        )

        self.assertEqual(task.calculate_time_left(), 5)

    def test_task_calculate_time_left_same_day_deadline(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="No date task",
            estimated_minutes=60,
            start_time=now,
            completed=False,
            deadline=now,  # Same day deadline (avoids midnight edge case)
            importance=7,
        )

        self.assertEqual(task.calculate_time_left(), 0)

    def test_tasks_can_have_subtasks(self):
        now = timezone.now()
        parent = Task.objects.create(
            user=self.user,
            title="Parent task",
            estimated_minutes=60,
            start_time=now,
            completed=False,
            deadline=now,
            importance=7,
        )

        child = Task.objects.create(
            user=self.user,
            title="child task",
            estimated_minutes=600,
            start_time=now,
            completed=False,
            deadline=now,
            importance=7,
            parent_task=parent,
        )

        self.assertEqual(parent.subtasks.count(), 1)
        self.assertEqual(child.parent_task, parent)

    def test_task_is_linked_to_user(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="user task",
            estimated_minutes=60,
            start_time=now,
            completed=False,
            deadline=now,
            importance=7,
        )

        self.assertEqual(task.user, self.user)
        self.assertEqual(self.user.tasks.count(), 1)

    def test_task_calculate_time_left_and_no_deadline_returns_zero(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="No deadline task",
            description="Testing no deadline",
            estimated_minutes=60,
            start_time=now,
            completed=False,
            deadline=now,
            importance=7,
        )
        task.deadline = None

        self.assertEqual(task.calculate_time_left(), 0)

    def test_task_clean_with_invalid_dates(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Clean test",
            description="Testing invalid dates",
            estimated_minutes=60,
            start_time=now + datetime.timedelta(days=100),
            completed=False,
            deadline=now,
            importance=7,
        )

        with self.assertRaises(ValidationError):
            task.full_clean()
