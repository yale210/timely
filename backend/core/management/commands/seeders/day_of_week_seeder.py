"""Day of Week Seeder module.

This module provides the `DayOfWeekSeeder` class, which ensures that the
standard seven days of the week are populated in the database for use in
scheduling and recurrence logic.
"""

from core.management.commands.seeders.base import BaseSeeder
from core.models import DayOfWeek


class DayOfWeekSeeder(BaseSeeder):
    """Seeder for the DayOfWeek model.

    This class populates the database with the constant set of seven days
    (1-7) representing Monday through Sunday, providing a reliable reference
    for other time-based models.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of days of the week into the database."

    def seed(self):
        """Execute the seeding logic for days of the week.

        Iterates through the range 1-7 and attempts to create each day
        in the database to ensure a complete weekly reference set.
        """
        for i in range(1, 8):
            try:
                self._create_day_of_week(i)
            except Exception as exception:
                print(f"Error creating day of week: {exception}")

    def _create_day_of_week(self, day):
        """Create or get a DayOfWeek record for a specific day number.

        Args:
            day (int): The integer representation of the day (1-7).

        """
        DayOfWeek.objects.get_or_create(
            day=day,
        )
