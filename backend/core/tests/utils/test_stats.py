from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

from core.models.task import Task
from core.utils.stats import calculate_weekly_stats, get_current_week_range


class WeeklyStatsTests(TestCase):
    def setUp(self):
        self.User = get_user_model()
        # project requires emails when creating users
        self.user = self.User.objects.create_user(
            username="tester", email="tester@example.com", password="pw"
        )

    def _create_task(self, **kwargs):
        defaults = {
            "user": self.user,
            "title": "task",
            "estimated_minutes": 30,
            "importance": 5,
            "start_time": timezone.now(),
            "deadline": timezone.now() + timedelta(hours=1),
        }
        defaults.update(kwargs)
        return Task.objects.create(**defaults)

    def test_no_tasks_in_week(self):
        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 0)
        self.assertEqual(stats["completed_tasks"], 0)
        self.assertEqual(stats["completion_percentage"], 0.0)
        self.assertEqual(stats["total_minutes_planned"], 0)

    def test_only_incomplete_tasks(self):
        start, end = get_current_week_range()
        # create 3 incomplete tasks inside week
        self._create_task(start_time=start + timedelta(hours=1), deadline=end - timedelta(hours=1), estimated_minutes=30, completed=False)
        self._create_task(start_time=start + timedelta(days=1), deadline=end - timedelta(days=1), estimated_minutes=60, completed=False)
        self._create_task(start_time=start + timedelta(days=2), deadline=end - timedelta(days=2), estimated_minutes=90, completed=False)

        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 3)
        self.assertEqual(stats["completed_tasks"], 0)
        self.assertEqual(stats["completion_percentage"], 0.0)
        self.assertEqual(stats["total_minutes_planned"], 180)

    def test_only_completed_tasks(self):
        start, end = get_current_week_range()
        self._create_task(start_time=start + timedelta(hours=2), deadline=end - timedelta(hours=2), estimated_minutes=45, completed=True)
        self._create_task(start_time=start + timedelta(days=3), deadline=end - timedelta(days=3), estimated_minutes=75, completed=True)

        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 2)
        self.assertEqual(stats["completed_tasks"], 2)
        self.assertAlmostEqual(stats["completion_percentage"], 100.0)
        self.assertEqual(stats["total_minutes_planned"], 120)

    def test_mixed_tasks_and_outside_week(self):
        start, end = get_current_week_range()
        # inside week
        self._create_task(start_time=start + timedelta(days=1), deadline=start + timedelta(days=1, hours=2), estimated_minutes=20, completed=True)
        self._create_task(start_time=start + timedelta(days=2), deadline=start + timedelta(days=2, hours=2), estimated_minutes=40, completed=False)

        # outside week (should be ignored)
        outside = start - timedelta(days=14)
        self._create_task(start_time=outside, deadline=outside + timedelta(hours=1), estimated_minutes=999, completed=True)

        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 2)
        self.assertEqual(stats["completed_tasks"], 1)
        self.assertAlmostEqual(stats["completion_percentage"], 50.0)
        self.assertEqual(stats["total_minutes_planned"], 60)
