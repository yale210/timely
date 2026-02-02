"""Day of Week Seeder"""


import random
import datetime
from core.models import DayOfWeek
from .fixtures import day_of_week
from django.contrib.auth import get_user_model
from django.core.management.base import BaseSeeder


class DayOfWeekSeeder(BaseSeeder):
    help = "Handles seeding of days of the week into the database."

    def seed(self):
        for day in days:
            try:
                self._create_day_of_week(day)
            except Exception as e:
                pass

    
    def _create_day_of_week(self, day):
        DayOfWeek.objects.get_or_create(
            day = day["day"],
        )

    
#class Day(models.IntegerChoices):
#        MONDAY = 1, "Monday"
#        TUESDAY = 2, "Tuesday"
#        WEDNESDAY = 3, "Wednesday"
#        THURSDAY = 4, "Thursday"
#        FRIDAY = 5, "Friday"
#        SATURDAY = 6, "Saturday"
#        SUNDAY = 7, "Sunday"