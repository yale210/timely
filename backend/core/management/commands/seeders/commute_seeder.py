"""Commute Seeder"""

import random
import datetime
from core.models import Commute
from .fixtures.commute_fixtures import commutes
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class CommuteSeeder(BaseSeeder):
    help = "Handles seeding of commutes into the database."

    def seed(self):
        self._create_fixture_commute()
        for i in range(200):
            self._populate_random_commute()

    def _create_fixture_commute(self):
        for commute in commutes:
            try:
                self._create_commute(commute)
            except Exception as exception:
                print(f"Error creating commute: {exception}")

    def _populate_random_commute(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        commute_start = self._random_time()
        commute_end = self._random_time()

        if commute_end == commute_start:
            commute_end = self._random_time()

        self._create_commute(
            {
                "fields": {
                    "user": temporary_user.id,
                    "commute_start": commute_start,
                    "commute_end": commute_end,
                }
            }
        )

    def _random_time(self):
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)

    def _create_commute(self, data):
        user = get_user_model().objects.get(id=data["fields"]["user"])
        Commute.objects.get_or_create(
            user=user,
            commute_start=data["fields"]["commute_start"],
            commute_end=data["fields"]["commute_end"],
        )
