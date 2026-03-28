"""Coverage-oriented tests for core stats utility functions."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.utils.stats import calculate_weekly_stats, get_current_week_range


class StatsCoverageTests(TestCase):
    """Test cases for stats coverage."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="stats-cov", email="stats@cov.com", password="pw"
        )

    def test_get_current_week_range_no_args(self):
        """Test get current week range no args."""
        start, end = get_current_week_range()
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)

    def test_get_current_week_range_with_mock(self):
        """Test get current week range with mock."""
        from unittest.mock import patch

        with patch("core.utils.stats.timezone.now") as mock_now:
            mock_now.return_value = timezone.now()
            get_current_week_range()
            mock_now.assert_called_once()

    def test_calculate_weekly_stats_no_args(self):
        """Test calculate weekly stats no args."""
        # This calls get_current_week_range(now=None)
        stats = calculate_weekly_stats(self.user)
        self.assertIn("total_tasks", stats)
