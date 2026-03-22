"""User Seeder"""

from .fixtures.user_fixtures import users
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class UserSeeder(BaseSeeder):
    help = "Handles seeding of users into the database."

    def seed(self):
        self._create_fixture_user()
        #for i in range(1000):
        #    self._populate_random_user()

    def _create_fixture_user(self):
        for user in users:
            try:
                self._create_user(user)
            except Exception as exception:
                print(f"Error occurred while creating user: {exception}")

    def _create_user(self, data):
        User = get_user_model()

        username = data["fields"]["username"]
        email = data["fields"]["email"]

        if User.objects.filter(username=username).exists():
            return None
        if User.objects.filter(email=email).exists():
            return None

        User.objects.get_or_create(
            username=username,
            id=data.get("pk"),
            defaults={
                "email": email,
                "password": data["fields"]["password"],
            },
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
