"""User Seeder"""

from .fixtures.user_fixtures import users
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class UserSeeder(BaseSeeder):
    help = "Handles seeding of users into the database."

    def seed(self):
        self._create_fixture_user()
        self._populate_random_user()

    def _create_fixture_user(self):
        for user in users:
            try:
                self._create_user(user)
            except Exception:
                pass

    def _create_user(self, data):
        User = get_user_model()
        User.objects.get_or_create(
            username=data["fields"]["username"],
            email=data["fields"]["email"],
            password=data["fields"]["password"],
        )

    def _populate_random_user(self):
        self._create_user(
            {
                "fields": {
                    "username": self.faker.user_name(),
                    "email": self.faker.email(),
                    "password": self.faker.password(),
                }
            }
        )
