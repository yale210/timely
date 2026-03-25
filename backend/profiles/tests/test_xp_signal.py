"""Tests for XP and level progression signal behavior."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models.task import Task
from profiles.models.profile import Profile

User = get_user_model()


class XpSignalTests(TestCase):
    """Test task-driven profile XP and level updates."""

    def setUp(self):
        """Create a user and base profile for XP signal tests."""
        self.user = User.objects.create_user(
            username="xp-user",
            password="password",
            email="xp@example.com",
        )
        self.profile, _ = Profile.objects.get_or_create(
            user=self.user,
            defaults={"name": "XP User"},
        )

    def _create_task(self, **overrides):
        """Create a task with defaults suitable for signal testing."""
        now = timezone.now()
        defaults = {
            "user": self.user,
            "title": "Signal test task",
            "estimated_minutes": 60,
            "start_time": now,
            "deadline": now + datetime.timedelta(days=1),
            "importance": 5,
            "completed": False,
        }
        defaults.update(overrides)
        return Task.objects.create(**defaults)

    def test_completing_task_awards_xp(self):
        """Verify moving a task to completed awards XP based on importance."""
        task = self._create_task(importance=7)

        task.completed = True
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 24)
        self.assertEqual(self.profile.level, 1)

    def test_editing_task_without_completion_change_does_not_adjust_xp(self):
        """Verify non-completion edits do not trigger XP updates."""
        task = self._create_task()

        task.title = "Renamed task"
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)
        self.assertEqual(self.profile.level, 1)

    def test_uncompleting_task_can_reduce_level(self):
        """Verify uncompleting a task deducts XP and can reduce the stored level."""
        self.profile.xp = 50
        self.profile.level = 3
        self.profile.save(update_fields=["xp", "level"])
        task = self._create_task(completed=False, importance=5)

        Task.objects.filter(pk=task.pk).update(completed=True)
        task.completed = False
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 30)
        self.assertEqual(self.profile.level, 1)

    def test_completing_task_can_create_missing_profile(self):
        """Verify completing a task creates a profile when one does not exist."""
        self.profile.delete()

        self._create_task(importance=10, completed=True)

        created_profile = Profile.objects.get(user=self.user)
        self.assertEqual(created_profile.name, self.user.username)
        self.assertEqual(created_profile.xp, 30)
        self.assertEqual(created_profile.level, 1)

    def test_completing_task_can_level_up_profile(self):
        """Verify completing a task can advance the stored level."""
        self.profile.xp = 270
        self.profile.level = 1
        self.profile.save(update_fields=["xp", "level"])
        task = self._create_task(importance=10)

        task.completed = True
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 300)
        self.assertEqual(self.profile.level, 2)
