"""Day of Week Seeder"""

from core.models import DayOfWeek
from core.management.base import BaseSeeder


class DayOfWeekSeeder(BaseSeeder):
    help = "Handles seeding of days of the week into the database."

    def seed(self):
        for i in range(1, 7):
            try:
                self._create_day_of_week(i)
            except Exception:
                pass

    def _create_day_of_week(self, day):
        DayOfWeek.objects.get_or_create(
            day=day,
        )


# class Day(models.IntegerChoices):
#        MONDAY = 1, "Monday"
#        TUESDAY = 2, "Tuesday"
#        WEDNESDAY = 3, "Wednesday"
#        THURSDAY = 4, "Thursday"
#        FRIDAY = 5, "Friday"
#        SATURDAY = 6, "Saturday"
#        SUNDAY = 7, "Sunday"
