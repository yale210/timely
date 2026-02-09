"""Profile Seeder"""

from core.models import Profile

from .fixtures import profiles
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class ProfileSeeder(BaseSeeder):
    help = "Handles seeding of profiles into the database."

    def seed(self):
        for profile in profiles:
            try:
                self._create_profile(profile)
            except Exception:
                pass

    def _create_profile(self, data):
        Profile.objects.get_or_create(
            user=data["fields"]["user"],
            date_of_birth=data["fields"]["date_of_birth"],
            creation_date=data["fields"]["creation_date"],
        )

    def populate_random_profile(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_profile(
            {
                "fields": {
                    "user": temporary_user,
                    "date_of_birth": self.faker.date(),
                    "creation_date": self.faker.date(),
                }
            }
        )
