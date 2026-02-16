from django.core.exceptions import ValidationError
from django.test import TestCase

from core.models import DayOfWeek
from core.models import Preference
from django.contrib.auth import get_user_model


class DayOfWeekTests(TestCase):
    def setUp(self):
        self.monday = DayOfWeek.objects.create(day=DayOfWeek.Day.MONDAY)

    def test_str_method_returns_day_name(self):
        self.assertEqual(str(self.monday), "Monday")

    def test_unique_constraint_on_day_field(self):
        with self.assertRaises(ValidationError):
            duplicate_monday = DayOfWeek(day=DayOfWeek.Day.MONDAY)
            duplicate_monday.full_clean()

    def test_model_integrates_with_preference_days_off(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        preference = Preference.objects.create(
            user=user,
            sleep_start="22:00",
            sleep_end="07:00",
        )
        preference.days_off.add(self.monday)
        self.assertIn(self.monday, preference.days_off.all())
