"""Day of Week Seeder"""

from core.models import DayOfWeek
from core.management.commands.seeders.base import BaseSeeder


class DayOfWeekSeeder(BaseSeeder):
    help = "Handles seeding of days of the week into the database."

    """
    Create 7 days of the week: Monday through to Sunday.
    """

    def seed(self):
        for i in range(1, 8):
            try:
                self._create_day_of_week(i)
            except Exception:
                pass

    def _create_day_of_week(self, day):
        DayOfWeek.objects.get_or_create(
            day=day,
        )
