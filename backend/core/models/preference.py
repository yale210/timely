from django.db import models
from django.conf import settings
from holidays.countries.united_kingdom import UnitedKingdom
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta

from .day_of_week import DayOfWeek


class Preference(models.Model):
    """
    This model allows users to store their preferences.
    Preferences are used to help customise their scheduling.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preference"
    )

    sleep_start = models.TimeField()
    sleep_end = models.TimeField()

    # Used to store the days a user wishes to have off each week.
    days_off = models.ManyToManyField(
        DayOfWeek,
        blank=True,
        related_name="preferences",
    )

    def clean(self):
        super().clean()
        if self.sleep_start == self.sleep_end:
            raise ValidationError(
                {"sleep_end": "sleep_start must be different to sleep_end"}
            )

        # midnight crossing
        start = datetime.combine(datetime.today(), self.sleep_start)
        end = datetime.combine(datetime.today(), self.sleep_end)

        if end <= start:
            end += timedelta(days=1)  # Sleep crosses midnight

    # Retrieve all UK holidays for inputted year.
    def get_holidays_for_year(self, input_year):
        return UnitedKingdom(years=[input_year])

    # Get the sleep length of the user.
    def get_sleep(self):
        return f"{self.sleep_start} - {self.sleep_end}"
