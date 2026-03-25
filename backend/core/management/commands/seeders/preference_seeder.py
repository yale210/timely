"""Preference Seeder module.

This module provides the `PreferenceSeeder` class, which handles the generation
of user preference data, such as day start/end times and preferred days off.
It facilitates testing user-specific configuration and scheduling constraints.
"""

import random
import datetime
from core.models import Preference, DayOfWeek
from .fixtures.preference_fixtures import preferences
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class PreferenceSeeder(BaseSeeder):
    """Seeder for the Preference model.

    This class orchestrates the seeding of preferences by loading predefined
    fixtures and generating a large set of random user preferences in the
    database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of preferences into the database."

    def seed(self):
        """Execute the seeding logic for preferences.

        This method first loads fixture preferences and then generates
        a large number of randomized preferences to test diverse user
        scheduling configurations.
        """
        self._create_fixture_preference()
        # Generate random preferences across various users
        for _ in range(200):
            self._populate_random_preference()

    def _create_fixture_preference(self):
        """Load and create preference instances from predefined fixtures.

        Iterates through the `preferences` list from fixtures and attempts
        to persist each record.
        """
        for temporary_preference in preferences:
            try:
                self._create_preference(temporary_preference)
            except Exception as exception:
                print(f"Error occurred while creating preference: {exception}")

    def _create_preference(self, data):
        """Create or get a Preference record from raw data.

        Handles mapping field data and randomly assigning days off to
        provide varied scheduling constraints.

        Args:
            data (dict): A dictionary containing preference field metadata.

        Returns:
            bool: True if a new record was created, False otherwise.

        """
        temporary_preference, created = Preference.objects.get_or_create(
            user_id=data["fields"]["user"],
            defaults={
                "day_start": data["fields"]["day_start"],
                "day_end": data["fields"]["day_end"],
            },
        )

        # Randomly assign a subset of days as days off for the user
        chosen_days = random.sample([1, 2, 3, 4, 5, 6, 7], random.randint(0, 7))
        days = DayOfWeek.objects.filter(day__in=chosen_days)

        for day in days:
            temporary_preference.days_off.add(day)

        return created

    def _populate_random_preference(self):
        """Generate a single random preference and assign it to a random user.

        Finds an existing user or creates a fallback user, then generates
        randomized day start and end times.

        Returns:
            bool: True if a new record was created, False otherwise.

        """
        User = get_user_model()
        # Fetch a random user from the database
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            # Create a fallback user if the database is empty
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        # Construct and persist the random preference
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
        """Generate a random `datetime.time` object.

        Returns:
            datetime.time: A randomly generated time.

        """
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)
