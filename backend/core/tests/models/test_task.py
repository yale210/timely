import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from core.models import Task


class TaskTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
        )

    def test_task_calculate_time_left_is_overdue_returns_zero(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="Overdue task",
            task_category=None,
            estimated_minutes=45,
            start_time=today,
            completed=False,
            deadline=today - datetime.timedelta(days=10),
            importance=10,
        )

        self.assertEqual(task.calculate_time_left(), 0)

    def test_task_calculate_time_left_deadline(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="Deadline task",
            task_category=None,
            estimated_minutes=45,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=5),
            importance=7,
        )

        self.assertEqual(task.calculate_time_left(), 5)

    def test_task_calculate_time_left_same_day_deadline(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="No date task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )

        self.assertEqual(task.calculate_time_left(), 0)

    def test_tasks_can_have_subtasks(self):
        today = timezone.now().date()
        parent = Task.objects.create(
            user=self.user,
            task_message="Parent task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )

        child = Task.objects.create(
            user=self.user,
            task_message="child task",
            task_category=None,
            estimated_minutes=600,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
            parent_task=parent,
        )

        self.assertEqual(parent.subtasks.count(), 1)
        self.assertEqual(child.parent_task, parent)

    def test_task_is_linked_to_user(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="user task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )

        self.assertEqual(task.user, self.user)
        self.assertEqual(self.user.tasks.count(), 1)

    def test_task_calculate_time_left_and_no_deadline_returns_zero(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="No deadline task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )
        task.deadline = None

        self.assertEqual(task.calculate_time_left(), 0)

    def test_task_clean_with_invalid_dates(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="Clean test",
            task_category=None,
            estimated_minutes=60,
            start_time=today + datetime.timedelta(days=100),
            completed=False,
            deadline=today,
            importance=7,
        )

        with self.assertRaises(ValidationError):
            task.full_clean()
