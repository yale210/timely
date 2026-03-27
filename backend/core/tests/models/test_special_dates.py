"""Tests for special dates."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
import datetime
from core.models import SpecialDates


class SpecialDatesTests(TestCase):
    """Test cases for special dates."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )

    def test_special_dates_str_with_text(self):
        """Test special dates str with text."""
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=(timezone.now() - timezone.timedelta(days=30)).date(),
            text="New Year",
        )

        self.assertEqual(str(special_date), "New Year")

    def test_special_dates_str_without_text(self):
        """Test special dates str without text."""
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=(timezone.now() - timezone.timedelta(days=29)).date(),
            text="",
        )

        self.assertEqual(str(special_date), "")

    def test_special_date_can_be_linked_to_a_user(self):
        """Test special date can be linked to a user."""
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=(timezone.now() - timezone.timedelta(days=2)).date(),
            text="Day in bed",
        )

        self.assertEqual(special_date.user, self.user)
        self.assertEqual(self.user.special_dates.count(), 1)

    def test_get_holidays_for_year_contains_christmas(self):
        """Test get holidays for year contains christmas."""
        special_dates = SpecialDates(user=self.user)
        holidays = special_dates.get_holidays_for_year(2026)
        self.assertIn(
            datetime.date(2026, 12, 25),
            holidays,
        )

    def test_get_holidays_for_year_returns_data(self):
        """Test get holidays for year returns data."""
        special_dates = SpecialDates(user=self.user)
        holidays = special_dates.get_holidays_for_year(2025)
        self.assertGreater(len(holidays), 0)
