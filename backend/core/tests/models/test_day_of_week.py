"""Tests for day of week."""

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.models import DayOfWeek
from core.models import Preference
from django.contrib.auth import get_user_model


class DayOfWeekTests(TestCase):
    """Test cases for day of week."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.monday = DayOfWeek.objects.get_or_create(day=DayOfWeek.Day.MONDAY)[0]

    def test_str_method_returns_day_name(self):
        """Test str method returns day name."""
        self.assertEqual(str(self.monday), "Monday")

    def test_unique_constraint_on_day_field(self):
        """Test unique constraint on day field."""
        with self.assertRaises(ValidationError):
            duplicate_monday = DayOfWeek(day=DayOfWeek.Day.MONDAY)
            duplicate_monday.full_clean()

    def test_model_integrates_with_preference_days_off(self):
        """Test model integrates with preference days off."""
        User = get_user_model()
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        preference = Preference.objects.create(
            user=user,
            day_start="07:00",
            day_end="22:00",
        )
        preference.days_off.add(self.monday)
        self.assertIn(self.monday, preference.days_off.all())
