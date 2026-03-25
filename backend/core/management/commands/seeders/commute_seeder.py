"""Commute Seeder module.

This module provides the `CommuteSeeder` class, which handles the generation
of commute-related data for users. It supports both fixture-based commutes
and randomly generated commutes for performance and scalability testing.
"""

import random
import datetime
from core.models import Commute
from .fixtures.commute_fixtures import commutes
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class CommuteSeeder(BaseSeeder):
    """Seeder for the Commute model.

    This class orchestrates the seeding of commutes by loading predefined
    fixtures and generating a large set of random commutes assigned to
    users in the database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of commutes into the database."

    def seed(self):
        """Execute the seeding logic for commutes.

        This method first loads fixture commutes and then generates
        a large set of randomized commutes to test scheduling and
        overlap logic.
        """
        self._create_fixture_commute()
        # Generate random commutes across various users
        for _ in range(200):
            self._populate_random_commute()

    def _create_fixture_commute(self):
        """Load and create commute instances from predefined fixtures.

        Iterates through the `commutes` list from fixtures and attempts
        to persist each record.
        """
        for commute in commutes:
            try:
                self._create_commute(commute)
            except Exception as exception:
                print(f"Error occurred while creating commute: {exception}")

    def _populate_random_commute(self):
        """Generate a single random commute and assign it to a random user.

        Finds an existing user or creates a fallback user, then generates
        randomized start and end times for the commute.
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
        commute_start = self._random_time()
        commute_end = self._random_time()

        # Ensure start and end times are distinct
        if commute_end == commute_start:
            commute_end = self._random_time()

        # Construct and persist the random commute
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
        """Generate a random `datetime.time` object.

        Returns:
            datetime.time: A randomly generated time.

        """
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)

        return datetime.time(hour=hours, minute=minutes)

    def _create_commute(self, data):
        """Create or get a Commute record from raw data.

        Args:
            data (dict): A dictionary containing commute field metadata.

        """
        Commute.objects.get_or_create(
            user_id=data["fields"]["user"],
            commute_start=data["fields"]["commute_start"],
            commute_end=data["fields"]["commute_end"],
        )
