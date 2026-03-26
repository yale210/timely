from datetime import time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.management.commands.seeders.day_of_week_seeder import DayOfWeekSeeder
from core.management.commands.seeders.grade_seeder import GradeSeeder
from core.management.commands.seeders.preference_seeder import PreferenceSeeder
from core.management.commands.seeders.special_dates_seeder import SpecialDatesSeeder
from core.management.commands.seeders.user_seeder import UserSeeder
from core.models import Category, Grade, Preference, SpecialDates
from profiles.management.commands.seeders.profile_seeder import ProfileSeeder
from profiles.models import Profile

from .common import SeederTestCase


class SeederMiscTests(SeederTestCase):
    def test_grade_special_dates_user_and_profile_seeders_cover_fallback_and_updates(
        self,
    ):
        user = get_user_model().objects.create_user(
            username="mixed-owner",
            email="mixed-owner@example.com",
            password="password123",
        )
        Category.objects.create(user=user, text="Grades", colour="#111111")

        grade_seeder_instance = GradeSeeder()
        with (
            patch.object(grade_seeder_instance, "faker") as faker,
            patch(
                "core.management.commands.seeders.grade_seeder.random.randint",
                return_value=88,
            ),
        ):
            faker.sentence.return_value = "Mock grade"
            faker.date.return_value = "2026-05-01"
            grade_seeder_instance._populate_random_grade()

        self.assertTrue(Grade.objects.filter(name="Mock grade").exists())

        special_dates_seeder_instance = SpecialDatesSeeder()
        with patch.object(special_dates_seeder_instance, "faker") as faker:
            faker.user_name.return_value = "holiday-user"
            faker.email.return_value = "holiday@example.com"
            faker.date.return_value = "2026-12-25"
            faker.sentence.return_value = "Holiday"
            special_dates_seeder_instance._populate_random_special_date()

        self.assertTrue(SpecialDates.objects.filter(text="Holiday").exists())

        user_seeder_instance = UserSeeder()
        duplicate_email = get_user_model().objects.create_user(
            username="existing-user",
            email="dupe@example.com",
            password="password123",
        )
        self.assertIsNone(
            user_seeder_instance._create_user(
                {
                    "fields": {
                        "username": "new-user",
                        "email": duplicate_email.email,
                        "password": "password123",
                    }
                }
            )
        )

        with patch.object(user_seeder_instance, "faker") as faker:
            faker.user_name.return_value = "random-user"
            faker.email.return_value = "random@example.com"
            faker.password.return_value = "secret"
            user_seeder_instance._populate_random_user()

        self.assertTrue(
            get_user_model().objects.filter(username="random-user").exists()
        )

        profile_seeder_instance = ProfileSeeder()
        creation_date = "2026-06-01T08:30:00"
        profile_seeder_instance._create_profile(
            {
                "fields": {
                    "user": user.id,
                    "date_of_birth": "2000-01-01",
                    "creation_date": creation_date,
                }
            }
        )
        profile = Profile.objects.get(user=user)
        self.assertTrue(timezone.is_aware(profile.creation_date))

    def test_preference_day_of_week_and_profile_seeders_cover_remaining_helper_paths(
        self,
    ):
        preference_seeder_instance = PreferenceSeeder()
        with patch.object(preference_seeder_instance, "faker") as faker:
            faker.user_name.return_value = "preference-fallback-user"
            faker.email.return_value = "preference-fallback@example.com"
            created = preference_seeder_instance._populate_random_preference()

        self.assertTrue(created)
        self.assertTrue(
            Preference.objects.filter(
                user__username="preference-fallback-user"
            ).exists()
        )

        with patch(
            "core.management.commands.seeders.preference_seeder.random.randint",
            side_effect=[6, 30],
        ):
            self.assertEqual(preference_seeder_instance._random_time(), time(6, 30))

        day_seeder = DayOfWeekSeeder()
        with (
            patch.object(
                day_seeder, "_create_day_of_week", side_effect=Exception("boom")
            ),
            patch("builtins.print") as print_mock,
        ):
            day_seeder.seed()
        self.assertEqual(print_mock.call_count, 7)

        profile_seeder_instance = ProfileSeeder()
        get_user_model().objects.all().delete()
        with patch.object(profile_seeder_instance, "faker") as faker:
            faker.user_name.return_value = "profile-fallback-user"
            faker.email.return_value = "profile-fallback@example.com"
            faker.date.side_effect = ["2001-01-01", "2026-07-01"]
            profile_seeder_instance._populate_random_profile()

        self.assertTrue(
            Profile.objects.filter(user__username="profile-fallback-user").exists()
        )
