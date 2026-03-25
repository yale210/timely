"""Seeder for User models.

This module provides the UserSeeder class, which handles populating the
database with both predefined fixture users and randomly generated users
for development and testing environments.
"""

from .fixtures.user_fixtures import users
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class UserSeeder(BaseSeeder):
    """Seeder class for the User model.

    This seeder ensures that the database has a set of predefined fixture
    users and a large number of randomly generated users to simulate
    a realistic database load.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of users into the database."

    def seed(self):
        """Execute the seeding process for users.

        First creates users from defined fixtures, then generates 1000
        random users to provide a large dataset.
        """
        self._create_fixture_user()
        for i in range(1000):
            self._populate_random_user()

    def _create_fixture_user(self):
        """Iterate through predefined user fixtures and create them.

        Logs an error message if a specific fixture fails to be created.
        """
        for user in users:
            try:
                self._create_user(user)
            except Exception as exception:
                print(f"Error occurred while creating user: {exception}")

    def _create_user(self, data):
        """Create or get a User record from raw data.

        Checks for existing username or email to avoid duplicates.

        Args:
            data (dict): A dictionary containing user field metadata, including
                username, email, and password.

        Returns:
            None: Returns None if a user with the same username or email
                already exists.

        """
        User = get_user_model()

        username = data["fields"]["username"]
        email = data["fields"]["email"]

        if User.objects.filter(username=username).exists():
            return None
        if User.objects.filter(email=email).exists():
            return None

        User.objects.get_or_create(
            id=data.get("pk"),
            username=username,
            defaults={
                "email": email,
                "password": data["fields"]["password"],
            },
        )

    def _populate_random_user(self):
        """Generate and save a single user with randomized data.

        Uses Faker to generate realistic usernames, emails, and passwords.
        """
        self._create_user(
            {
                "fields": {
                    "username": self.faker.user_name(),
                    "email": self.faker.email(),
                    "password": self.faker.password(),
                }
            }
        )
