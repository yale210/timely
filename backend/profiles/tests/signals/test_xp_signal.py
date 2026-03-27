"""Tests for profile XP and level signal behavior."""

from django.test import TestCase

from core.tests.factories import TaskFactory, UserFactory
from profiles.models.profile import Profile


class XPSignalTests(TestCase):
    """Test XP and level adjustments triggered by task completion changes."""

    def setUp(self):
        """Create a user/profile pair shared across XP signal tests."""
        self.user = UserFactory()
        self.profile = Profile.objects.get(user=self.user)

    def test_completing_task_awards_xp(self):
        """Verify completing a task awards XP based on task importance."""
        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.completed = True
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 20)  # 10 + (2 * 5)

    def test_uncompleting_task_deducts_xp(self):
        """Verify marking a completed task incomplete removes the awarded XP."""
        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.completed = True
        task.save()

        task.completed = False
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)

    def test_xp_does_not_go_below_zero(self):
        """Verify XP never drops below zero after undoing completion."""
        task = TaskFactory(user=self.user, importance=5, completed=True)
        task.completed = False
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)

    def test_saving_task_without_changing_completed_does_not_award_xp(self):
        """Verify unrelated task saves do not change profile XP."""
        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.title = "Updated title"
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)

    def test_completing_task_triggers_level_up(self):
        """Verify enough earned XP promotes the profile to the next level."""
        self.profile.xp = 270
        self.profile.save()

        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.completed = True
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.level, 2)
