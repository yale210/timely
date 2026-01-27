import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import SpecialDates


class SpecialDatesTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
        )

    def test_special_dates_str_with_text(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=datetime.date(2025, 1, 1),
            text="New Year",
        )

        self.assertEqual(str(special_date), "New Year")

    def test_special_dates_str_without_text(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=datetime.date(2025, 1, 2),
            text="",
        )

        self.assertEqual(str(special_date), "")

    def test_special_date_can_be_linked_to_a_user(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=datetime.date(2026, 1, 25),
            text="Day in bed",
        )

        self.assertEqual(special_date.user, self.user)
        self.assertEqual(self.user.special_dates.count(), 1)
