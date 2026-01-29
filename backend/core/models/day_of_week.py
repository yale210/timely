from django.db import models


class DayOfWeek(models.Model):
    class Day(models.IntegerChoices):
        MONDAY = 1, "Monday"
        TUESDAY = 2, "Tuesday"
        WEDNESDAY = 3, "Wednesday"
        THURSDAY = 4, "Thursday"
        FRIDAY = 5, "Friday"
        SATURDAY = 6, "Saturday"
        SUNDAY = 7, "Sunday"

    day = models.PositiveSmallIntegerField(choices=Day.choices, unique=True)

    def __str__(self):
        return self.get_day_display()
