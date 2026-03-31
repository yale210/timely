"""Seeder for User models.

This module provides the UserSeeder class, which handles populating the
database with both predefined fixture users and randomly generated users
for development and testing environments.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from core.management.commands.seeders.base import BaseSeeder

from .fixtures.user_fixtures import users


class UserSeeder(BaseSeeder):
    """Seeder class for the User model.

    This seeder ensures that the database has a set of predefined fixture
    users and a large number of randomly generated users to simulate
    a realistic database load.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of users into the database."
    RANDOM_USER_PASSWORD_HASH = make_password("Password123")

    def seed(self):
        """Execute the seeding process for users.

        First creates users from defined fixtures, then generates 250
        random users to provide a large dataset.
        """
        self._create_fixture_user()
        for i in range(250):
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

        """
        User = get_user_model()

        username = data["fields"]["username"]
        email = data["fields"]["email"]

        if User.objects.filter(email=email).exclude(username=username).exists():
            return

        user, _ = User.objects.update_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": data["fields"].get("is_staff", False),
                "is_superuser": data["fields"].get("is_superuser", False),
                "is_active": True,
            },
        )

        password = data["fields"]["password"]
        # Check if password is already hashed, otherwise hash it.
        if password.startswith("pbkdf2_"):
            if user.password != password:
                user.password = password
                user.save(update_fields=["password"])
        else:
            user.password = self.RANDOM_USER_PASSWORD_HASH
            user.save(update_fields=["password"])

    def _populate_random_user(self):
        """Generate and save a single user with randomized data.

        Uses Faker to generate realistic usernames, emails, and passwords.
        """
        self._create_user(
            {
                "fields": {
                    "username": self.faker.user_name(),
                    "email": self.faker.email(),
                    "password": "Password123",
                }
            }
        )
