from django.db import models
from django.conf import settings
from holidays.countries.united_kingdom import UnitedKingdom
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from django.core.validators import MinValueValidator, MaxValueValidator

from .day_of_week import DayOfWeek


class Preference(models.Model):
    """
    This model allows users to store their preferences.
    Preferences are used to help customise their scheduling.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preference"
    )

    # Used to store the days a user wishes to have off each week.
    days_off = models.ManyToManyField(
        DayOfWeek,
        blank=True,
        related_name="preferences",
    )

    day_start = models.TimeField(default="08:00")
    day_end = models.TimeField(default="22:00")

    max_hours_study_per_day = models.PositiveSmallIntegerField(
        default=4,
        validators=[MinValueValidator(0), MaxValueValidator(24)]
    )

    def clean(self):
        super().clean()
        if self.day_start == self.day_end:
            raise ValidationError({
                "day_end": "day_start must be different to day_end"
            })

        # midnight crossing
        start = datetime.combine(datetime.today(), self.day_start)
        end = datetime.combine(datetime.today(), self.day_end)

        if end <= start:
            end += timedelta(days=1)  # Sleep crosses midnight

        minutesAvailable = int((end-start).total_seconds() // 60)
        if self.max_hours_study_per_day * 60 > minutesAvailable:
            raise ValidationError({
                "max_hours_study_per_day": "Max study hours exceeds your available day length."
            })

    # Retrieve all UK holidays for inputted year.
    def get_holidays_for_year(self, input_year):
        return UnitedKingdom(years=[input_year])

    # Get the sleep length of the user.
    def get_break_time(self):
        return f"{self.day_start} - {self.day_end}"