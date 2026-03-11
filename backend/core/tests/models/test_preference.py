import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from core.models import Preference


class PreferenceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )

    def test_preference_helpers(self):
        preference = Preference.objects.create(
            user=self.user,
            day_start=datetime.time(7, 0),
            day_end=datetime.time(23, 0),
        )

        self.assertEqual(preference.get_break_time(), "07:00:00 - 23:00:00")

    def test_day_start_cannot_equal_day_end(self):
        preference = Preference(
            user=self.user,
            day_start=datetime.time(8, 0),
            day_end=datetime.time(8, 0),
        )

        with self.assertRaises(ValidationError):
            preference.full_clean()

    def test_allows_day_crossing_midnight(self):
        preference = Preference.objects.create(
            user=self.user,
            day_start=datetime.time(20, 0),
            day_end=datetime.time(10, 0),
        )
        preference.full_clean()
