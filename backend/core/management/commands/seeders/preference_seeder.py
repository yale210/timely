"""Preference Seeder"""

import random
import datetime
from core.models import Preference, DayOfWeek
from .fixtures.preference_fixtures import preferences
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class PreferenceSeeder(BaseSeeder):
    help = "Handles seeding of preferences into the database."

    def seed(self):
        self._create_fixture_preference()
        self._populate_random_preference()

    def _create_fixture_preference(self):
        for temporary_preference in preferences:
            try:
                self._create_preference(temporary_preference)
            except Exception:
                pass

    def _create_preference(self, data):
        temporary_preference = Preference.objects.get_or_create(
            user=data["fields"]["user"],
            sleep_start=data["fields"]["sleep_start"],
            sleep_end=data["fields"]["sleep_end"],
        )

        chosen_days = random.sample([1, 2, 3, 4, 5, 6, 7], random.randint(0, 7))
        days = DayOfWeek.objects.filter(day__in=chosen_days)

        for day in days:
            temporary_preference.days_off.add(day)

    def populate_random_preference(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_preference(
            {
                "fields": {
                    "user": temporary_user,
                    "sleep_start": self._random_time(),
                    "sleep_end": self._random_time(),
                }
            }
        )

    def _random_time(self):
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)
