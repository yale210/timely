from django.db import models
from django.conf import settings

from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from zoneinfo import available_timezones
from zoneinfo import ZoneInfo
from django.utils import timezone
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
        default=4, validators=[MinValueValidator(0), MaxValueValidator(24)]
    )

    # Store as IANA timezone. Enables us to use timezone aware features (like adjusting for the clocks going forward or back).
    timezone = models.CharField(max_length=100, default="Europe/London")

    def clean(self):
        super().clean()
        if self.day_start == self.day_end:
            raise ValidationError({"day_end": "day_start must be different to day_end"})

        if self.timezone not in available_timezones():
            raise ValidationError({"timezone": "Timezone is not valid"})

        user_timezone = ZoneInfo(self.timezone)
        today = timezone.now().astimezone(user_timezone).date()

        # midnight crossing
        start = datetime.combine(today, self.day_start, tzinfo=user_timezone)
        end = datetime.combine(today, self.day_end, tzinfo=user_timezone)

        if end <= start:
            end += timedelta(days=1)  # Sleep crosses midnight

        minutesAvailable = int((end - start).total_seconds() // 60)
        if self.max_hours_study_per_day * 60 > minutesAvailable:
            raise ValidationError(
                {
                    "max_hours_study_per_day": "Max study hours exceeds your available day length."
                }
            )

    # Get the sleep length of the user.
    def get_break_time(self):
        return f"{self.day_start} - {self.day_end}"
