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
            max_daily_study_time=4,
        )

        holidays = preference.get_holidays_for_year(2025)

        self.assertTrue(len(holidays) > 0)
        self.assertEqual(preference.get_sleep(), "23:00:00 - 07:00:00")

    def test_maximum_study_time_can_be_24_hours(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=24,
        )
        preference.full_clean()

    def test_maximum_study_time_can_be_0_hours(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=0,
        )
        preference.full_clean()

    def test_maximum_study_time_cannot_be_25_hours(self):
        preference = Preference(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=25,
        )

        with self.assertRaises(ValidationError):
            preference.full_clean()

    def test_maximum_study_time_cannot_be_less_than_0_hours(self):
        preference = Preference(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=-1,
        )

        with self.assertRaises(ValidationError):
            preference.full_clean()
