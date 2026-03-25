"""Preference Seeder"""

import random
import datetime
from core.models import Preference
from core.models.preference import default_day_schedule
from .fixtures.preference_fixtures import preferences
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class PreferenceSeeder(BaseSeeder):
    help = "Handles seeding of preferences into the database."

    def seed(self):
        self._create_fixture_preference()

        for i in range(200):
            self._populate_random_preference()

    def _create_fixture_preference(self):
        for temporary_preference in preferences:
            try:
                self._create_preference(temporary_preference)
            except Exception as exception:
                print(f"Error occurred while creating preference: {exception}")

    def _create_preference(self, data):
        user = self.resolve_user(data["fields"]["user"])
        temporary_preference, created = Preference.objects.update_or_create(
            user=user,
            defaults={
                "day_start": data["fields"]["day_start"],
                "day_end": data["fields"]["day_end"],
                "timezone": data["fields"].get("timezone", "Europe/London"),
                "day_schedule": data["fields"].get(
                    "day_schedule", default_day_schedule()
                ),
            },
        )

        chosen_days = data["fields"].get("days_off")
        if chosen_days is None:
            chosen_days = random.sample([1, 2, 3, 4, 5, 6, 7], random.randint(0, 7))

        temporary_preference.days_off.set(self.resolve_days_of_week(chosen_days))

        return created

    def _populate_random_preference(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        return self._create_preference(
            {
                "fields": {
                    "user": temporary_user.id,
                    "day_start": self._random_time(),
                    "day_end": self._random_time(),
                    "timezone": "Europe/London",
                }
            }
        )

    def _random_time(self):
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)
