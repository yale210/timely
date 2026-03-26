"""DayOfWeek model definition."""

from django.db import models


class DayOfWeek(models.Model):
    """Model used to represent a day of the week.
    This is used to allow users to select days of the week for preferences such as days off.
    """

    class Day(models.IntegerChoices):
        """Enum for days of the week."""

        MONDAY = 1, "Monday"
        TUESDAY = 2, "Tuesday"
        WEDNESDAY = 3, "Wednesday"
        THURSDAY = 4, "Thursday"
        FRIDAY = 5, "Friday"
        SATURDAY = 6, "Saturday"
        SUNDAY = 7, "Sunday"

    day = models.PositiveSmallIntegerField(choices=Day.choices, unique=True)

    def __str__(self):
        """Return the day of the week as a string.

        Returns:
            str: The day of the week.
        """
        return self.get_day_display()
