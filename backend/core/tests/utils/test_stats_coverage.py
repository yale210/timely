from django.test import TestCase
from core.utils.stats import get_current_week_range, calculate_weekly_stats
from django.contrib.auth import get_user_model
from django.utils import timezone

class StatsCoverageTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="stats-cov", email="stats@cov.com", password="pw"
        )

    def test_get_current_week_range_no_args(self):
        start, end = get_current_week_range()
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)
        
    def test_get_current_week_range_with_mock(self):
        from unittest.mock import patch
        with patch('core.utils.stats.timezone.now') as mock_now:
            mock_now.return_value = timezone.now()
            get_current_week_range()
            mock_now.assert_called_once()

    def test_calculate_weekly_stats_no_args(self):
        # This calls get_current_week_range(now=None)
        stats = calculate_weekly_stats(self.user)
        self.assertIn("total_tasks", stats)
