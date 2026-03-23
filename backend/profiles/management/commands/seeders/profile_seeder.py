"""Profile Seeder"""

from profiles.models import Profile

from .fixtures.profile_fixtures import profiles
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class ProfileSeeder(BaseSeeder):
    help = "Handles seeding of profiles into the database."

    def seed(self):
        self._create_fixture_profile()

        # for i in range(200):
        #    self._populate_random_profile()

    def _create_fixture_profile(self):
        for profile in profiles:
            try:
                self._create_profile(profile)
            except Exception as exception:
<<<<<<< HEAD:backend/core/management/commands/seeders/profile_seeder.py
                print(f"Error creating profile: {exception}")

    def _create_profile(self, data):
        user = get_user_model().objects.get(id=data["fields"]["user"])
        Profile.objects.get_or_create(
            user=user,
=======
                print(f"Error occurred while creating profile: {exception}")

    def _create_profile(self, data):
        User = get_user_model()
        user_id = data["fields"]["user"]
        temporary_user = User.objects.filter(id=user_id).first()
        if temporary_user is None:
            return

        Profile.objects.get_or_create(
            user_id=user_id,
>>>>>>> origin/main:backend/profiles/management/commands/seeders/profile_seeder.py
            defaults={
                "name": temporary_user.username,
                "date_of_birth": data["fields"]["date_of_birth"],
                "creation_date": data["fields"]["creation_date"],
            },
        )

    def _populate_random_profile(self):
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
                    "user": temporary_user.id,
                    "date_of_birth": self.faker.date(),
                    "creation_date": self.faker.date(),
                }
            }
        )
