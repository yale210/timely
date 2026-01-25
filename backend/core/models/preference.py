from django.db import models
from django.conf import settings
from holidays.countries.united_kingdom import UnitedKingdom
from django.core.validators import MinValueValidator, MaxValueValidator


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

    # Users can set a maximum study length to avoid burnout.
    max_daily_study_time = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(24)]
    )

    # Used to store the days a user wishes to have off each week.
    # There is a separate special dates model for any other one off dates (like "My birthday! : 25th april", etc)
    days_off = models.JSONField(
        default=list,
        blank=True,
        help_text="List of days off: 1=Monday,2=Tuesday...,7=Sunday",
    )

    # Retrieve all UK holidays for inputted year.
    def getHolidaysForYear(self, input_year):
        return UnitedKingdom(years=[input_year])

    # Get the sleep length of the user.
    def getSleep(self):
        return f"{self.sleep_start} - {self.sleep_end}"
