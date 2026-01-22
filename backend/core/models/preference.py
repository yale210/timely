from django.db import models
from django.conf import settings
from holidays.countries.united_kingdom import UnitedKingdom
from django.core.validators import MinValueValidator, MaxValueValidator

# Preferences: Sleep start and end time, commute time, Date/time when not to schedule tasks (rest times), max study hours per day


class Preference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preference"
    )

    sleep_start = models.TimeField()
    sleep_end = models.TimeField()

    max_daily_study_time = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(24)]
    )

    # 1=Monday,2=Tuesday...,7=Sunday
    # Separate special dates model for any other one off dates (like "My birthday! : 25th april", etc)
    days_off = models.JSONField(default=list, blank=True)

    # User may want certain holidays or dates off (birthdays, weddings, etc). We will store this in a separate model for ease.
    # A typical user will commute twice or more a day. I have added a commute model just to make it easier to handle this (particulary when doing the timetable)

    # Get the a list of holidays for an inputted year.
    # Assumes united kingdom holidays only.
    # Year as int.
    def getHolidaysForYear(self, input_year):
        return UnitedKingdom(years=[input_year])

    def getSleep(self):
        return f"{self.sleep_start} - {self.sleep_end}"
