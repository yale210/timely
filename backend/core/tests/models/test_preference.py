import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from core.models import Preference


class PreferenceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
        )

    def test_preference_helpers(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
        )

        holidays = preference.get_holidays_for_year(2025)

        self.assertGreater(len(holidays), 0)
        self.assertEqual(preference.get_sleep(), "23:00:00 - 07:00:00")

    
    
    def test_sleep_start_cannot_equal_sleep_end(self):
        preference = Preference(
            user=self.user,
            sleep_start=datetime.time(8, 0),
            sleep_end=datetime.time(8, 0),
            
        )

        with self.assertRaises(ValidationError):
            preference.full_clean()

    def test_allows_sleep_crossing_midnight(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(20, 0),
            sleep_end=datetime.time(10, 0),
            
        )
        preference.full_clean()

    def test_get_holidays_for_year_contains_christmas(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(20, 0),
            sleep_end=datetime.time(10, 0),
            
        )
        holidays = preference.get_holidays_for_year(2026)
        self.assertIn(
            datetime.date(2026, 12, 25),
            holidays,
        )
