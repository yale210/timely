from django.test import TestCase

from core.tests.factories import TaskFactory, UserFactory
from profiles.models.profile import Profile


class XPSignalTests(TestCase):
    def setUp(self):
        self.user = UserFactory()
        self.profile = Profile.objects.get(user=self.user)

    def test_completing_task_awards_xp(self):
        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.completed = True
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 20)  # 10 + (2 * 5)

    def test_uncompleting_task_deducts_xp(self):
        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.completed = True
        task.save()

        task.completed = False
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)

    def test_xp_does_not_go_below_zero(self):
        task = TaskFactory(user=self.user, importance=5, completed=True)
        task.completed = False
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)

    def test_saving_task_without_changing_completed_does_not_award_xp(self):
        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.title = "Updated title"
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.xp, 0)

    def test_completing_task_triggers_level_up(self):
        self.profile.xp = 270
        self.profile.save()

        task = TaskFactory(user=self.user, importance=5, completed=False)
        task.completed = True
        task.save()

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.level, 2)
