"""Special Dates Seeder module.

This module provides the `SpecialDatesSeeder` class, which handles the generation
of user-specific special dates (e.g., holidays, birthdays, or specific one-off
events). It supports both fixture-based and randomized data generation.
"""

from core.models import SpecialDates
from .fixtures.special_dates_fixtures import special_dates
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class SpecialDatesSeeder(BaseSeeder):
    """Seeder for the SpecialDates model.

    This class orchestrates the seeding of special dates by loading predefined
    fixtures and generating a large set of random special date records assigned
    to users in the database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of special dates into the database."

    def seed(self):
        """Execute the seeding logic for special dates.

        This method first loads fixture special dates and then generates
        a large set of randomized special dates to test calendar alerts
        and date-specific behavior.
        """
        self._create_fixture_special_date()
        # Generate random special dates across various users
        for _ in range(200):
            self._populate_random_special_date()

    def _create_fixture_special_date(self):
        """Load and create special date instances from predefined fixtures.

        Iterates through the `special_dates` list from fixtures and attempts
        to persist each record.
        """
        for special_date in special_dates:
            try:
                self._create_special_date(special_date)
            except Exception as exception:
                print(f"Error occurred while creating special date: {exception}")

    def _create_special_date(self, data):
        """Create or get a SpecialDates record from raw data.

        Args:
            data (dict): A dictionary containing special date field metadata.

        """

        user = self.resolve_user(data["fields"]["user"])
        SpecialDates.objects.get_or_create(
            user=user,
            date=data["fields"]["date"],
            text=data["fields"]["text"],
        )

    def _populate_random_special_date(self):
        """Generate a single random special date and assign it to a random user.

        Finds an existing user or creates a fallback user, then generates
        a special date with a randomized date and descriptive text.
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

        # Construct and persist the random special date
        self._create_special_date(
            {
                "fields": {
                    "user": temporary_user.id,
                    "date": self.faker.date(),
                    "text": self.faker.sentence(),
                }
            }
        )
