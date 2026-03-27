"""Tests for core stats utility functions."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models.task import Task
from core.utils.stats import calculate_weekly_stats, get_current_week_range


class WeeklyStatsTests(TestCase):
    """Test cases for weekly stats."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.User = get_user_model()
        # project requires emails when creating users
        self.user = self.User.objects.create_user(
            username="tester", email="tester@example.com", password="pw"
        )

    def _create_task(self, **kwargs):
        """Create task."""
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
        """Test no tasks in week."""
        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 0)
        self.assertEqual(stats["completed_tasks"], 0)
        self.assertEqual(stats["completion_percentage"], 0.0)
        self.assertEqual(stats["total_minutes_planned"], 0)

    def test_only_incomplete_tasks(self):
        """Test only incomplete tasks."""
        start, end = get_current_week_range()
        # create 3 incomplete tasks inside week
        self._create_task(
            start_time=start + timedelta(hours=1),
            deadline=end - timedelta(hours=1),
            estimated_minutes=30,
            completed=False,
        )
        self._create_task(
            start_time=start + timedelta(days=1),
            deadline=end - timedelta(days=1),
            estimated_minutes=60,
            completed=False,
        )
        self._create_task(
            start_time=start + timedelta(days=2),
            deadline=end - timedelta(days=2),
            estimated_minutes=90,
            completed=False,
        )

        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 3)
        self.assertEqual(stats["completed_tasks"], 0)
        self.assertEqual(stats["completion_percentage"], 0.0)
        self.assertEqual(stats["total_minutes_planned"], 180)

    def test_only_completed_tasks(self):
        """Test only completed tasks."""
        start, end = get_current_week_range()
        self._create_task(
            start_time=start + timedelta(hours=2),
            deadline=end - timedelta(hours=2),
            estimated_minutes=45,
            completed=True,
        )
        self._create_task(
            start_time=start + timedelta(days=3),
            deadline=end - timedelta(days=3),
            estimated_minutes=75,
            completed=True,
        )

        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 2)
        self.assertEqual(stats["completed_tasks"], 2)
        self.assertAlmostEqual(stats["completion_percentage"], 100.0)
        self.assertEqual(stats["total_minutes_planned"], 120)

    def test_mixed_tasks_and_outside_week(self):
        """Test mixed tasks and outside week."""
        start, end = get_current_week_range()
        # inside week
        self._create_task(
            start_time=start + timedelta(days=1),
            deadline=start + timedelta(days=1, hours=2),
            estimated_minutes=20,
            completed=True,
        )
        self._create_task(
            start_time=start + timedelta(days=2),
            deadline=start + timedelta(days=2, hours=2),
            estimated_minutes=40,
            completed=False,
        )

        # outside week (should be ignored)
        outside = start - timedelta(days=14)
        self._create_task(
            start_time=outside,
            deadline=outside + timedelta(hours=1),
            estimated_minutes=999,
            completed=True,
        )

        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_tasks"], 2)
        self.assertEqual(stats["completed_tasks"], 1)
        self.assertAlmostEqual(stats["completion_percentage"], 50.0)
        self.assertEqual(stats["total_minutes_planned"], 60)

    def test_calculate_weekly_stats_with_fixed_now(self):
        """Deterministic week ranges when now is provided."""
        from datetime import datetime

        from django.utils import timezone

        now = timezone.make_aware(datetime(2026, 2, 16, 12, 0))
        start, end = get_current_week_range(now=now)
        # place a task inside the week
        self._create_task(
            start_time=start + timedelta(hours=2),
            deadline=start + timedelta(hours=3),
            estimated_minutes=15,
        )
        stats = calculate_weekly_stats(self.user, now=now)
        self.assertEqual(stats["total_tasks"], 1)

    def test_daily_breakdown_contains_seven_days(self):
        """Daily stats should contain seven entries starting Monday."""
        start, _ = get_current_week_range()
        # create one task on Monday and one on Sunday
        self._create_task(
            start_time=start,
            deadline=start + timedelta(hours=1),
            estimated_minutes=10,
            completed=True,
        )
        self._create_task(
            start_time=start + timedelta(days=6),
            deadline=start + timedelta(days=6, hours=1),
            estimated_minutes=20,
        )
        stats = calculate_weekly_stats(self.user)
        days = stats["daily_stats"]
        self.assertEqual(len(days), 7)
        self.assertEqual(days[0]["day"], start.strftime("%a"))

    def test_importance_breakdown_contains_ten_levels(self):
        """Importance stats must include levels 1..10."""
        start, _ = get_current_week_range()
        # create completed tasks at levels 1 and 10
        self._create_task(
            start_time=start,
            deadline=start + timedelta(hours=1),
            importance=1,
            completed=True,
        )
        self._create_task(
            start_time=start,
            deadline=start + timedelta(hours=2),
            importance=10,
            completed=True,
        )
        stats = calculate_weekly_stats(self.user)
        diff = stats["importance_stats"]
        self.assertEqual(len(diff), 10)
        self.assertEqual(diff[0]["level"], 1)
        self.assertEqual(diff[-1]["level"], 10)

    def test_total_minutes_calculation(self):
        """Total minutes should sum estimated_minutes for week tasks."""
        start, _ = get_current_week_range()
        self._create_task(
            start_time=start, deadline=start + timedelta(hours=1), estimated_minutes=5
        )
        self._create_task(
            start_time=start + timedelta(days=1),
            deadline=start + timedelta(days=1, hours=1),
            estimated_minutes=7,
        )
        stats = calculate_weekly_stats(self.user)
        self.assertEqual(stats["total_minutes_planned"], 12)

    def test_get_current_week_range_uses_timezone_now(self):
        """get_current_week_range should use timezone.now when no now provided."""
        start, end = get_current_week_range()
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)
