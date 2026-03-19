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

    def test_invalid_timezone(self):
        preference = Preference(user=self.user, timezone="Invalid/Timezone")
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("timezone", cm.exception.message_dict)

    def test_day_schedule_not_list(self):
        preference = Preference(user=self.user, day_schedule="not a list")
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_day_schedule_invalid_length(self):
        preference = Preference(user=self.user, day_schedule=[{"day": 1, "start": "08:00", "end": "22:00"}])
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_day_schedule_invalid_entry_type(self):
        sched = [None] * 7
        preference = Preference(user=self.user, day_schedule=sched)
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_day_schedule_invalid_day_value(self):
        sched = [{"day": i, "start": "08:00", "end": "22:00"} for i in range(7)] # 0 to 6
        preference = Preference(user=self.user, day_schedule=sched)
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_day_schedule_duplicate_day(self):
        sched = [{"day": 1, "start": "08:00", "end": "22:00"}] * 7
        preference = Preference(user=self.user, day_schedule=sched)
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_day_schedule_invalid_time_format(self):
        sched = [{"day": i, "start": "invalid", "end": "22:00"} for i in range(1, 8)]
        preference = Preference(user=self.user, day_schedule=sched)
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_day_schedule_start_equals_end(self):
        sched = [{"day": i, "start": "08:00", "end": "08:00"} for i in range(1, 8)]
        preference = Preference(user=self.user, day_schedule=sched)
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("day_schedule", cm.exception.message_dict)

    def test_max_hours_exceeds_available(self):
        # 2 hours available, but max_hours_study_per_day = 4
        sched = [{"day": i, "start": "08:00", "end": "10:00"} for i in range(1, 8)]
        preference = Preference(user=self.user, day_schedule=sched, max_hours_study_per_day=4, limit_max_hours=True)
        with self.assertRaises(ValidationError) as cm:
            preference.full_clean()
        self.assertIn("max_hours_study_per_day", cm.exception.message_dict)

    def test_get_day_window_valid(self):
        preference = Preference.objects.create(user=self.user)
        # Friday is weekday 4, so day 5 in our 1-7 scheme
        target_date = datetime.date(2026, 3, 20) # Friday
        start, end = preference.get_day_window(target_date)
        self.assertEqual(start, datetime.time(8, 0))
        self.assertEqual(end, datetime.time(22, 0))

    def test_get_day_window_fallback(self):
        preference = Preference.objects.create(user=self.user, day_schedule=[])
        target_date = datetime.date(2026, 3, 20)
        start, end = preference.get_day_window(target_date)
        # Fallback returns self.day_start/end which might be strings from defaults
        self.assertEqual(str(start), "08:00")
        self.assertEqual(str(end), "22:00")

    def test_get_day_window_malformed_entry(self):
        preference = Preference.objects.create(user=self.user, day_schedule=[{"day": 5, "start": "invalid", "end": "22:00"}] + [{"day": i, "start": "08:00", "end": "22:00"} for i in range(1, 5)] + [{"day": i, "start": "08:00", "end": "22:00"} for i in range(6, 8)])
        target_date = datetime.date(2026, 3, 20)
        start, end = preference.get_day_window(target_date)
        self.assertEqual(str(start), "08:00")
