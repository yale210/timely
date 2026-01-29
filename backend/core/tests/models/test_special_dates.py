from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

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
            date=(timezone.now() - timezone.timedelta(days=30)).date(),
            text="New Year",
        )

        self.assertEqual(str(special_date), "New Year")

    def test_special_dates_str_without_text(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=(timezone.now() - timezone.timedelta(days=29)).date(),
            text="",
        )

        self.assertEqual(str(special_date), "")

    def test_special_date_can_be_linked_to_a_user(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=(timezone.now() - timezone.timedelta(days=2)).date(),
            text="Day in bed",
        )

        self.assertEqual(special_date.user, self.user)
        self.assertEqual(self.user.special_dates.count(), 1)
