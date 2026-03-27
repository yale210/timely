"""Preference model definitions."""

from django.db import models
from django.conf import settings

from django.core.exceptions import ValidationError
from datetime import datetime
from django.core.validators import MinValueValidator, MaxValueValidator
from zoneinfo import available_timezones
from zoneinfo import ZoneInfo
from django.utils import timezone
from .day_of_week import DayOfWeek


def default_day_schedule():
    """Return the weekly available time slots for the user.
    The user is by default available from 8am to 10pm.
    """
    return [
        {"day": 1, "start": "08:00", "end": "22:00"},
        {"day": 2, "start": "08:00", "end": "22:00"},
        {"day": 3, "start": "08:00", "end": "22:00"},
        {"day": 4, "start": "08:00", "end": "22:00"},
        {"day": 5, "start": "08:00", "end": "22:00"},
        {"day": 6, "start": "08:00", "end": "22:00"},
        {"day": 7, "start": "08:00", "end": "22:00"},
    ]


class Preference(models.Model):
    """This model allows users to store their preferences.
    Preferences are used to help customise their scheduling.
    """

    LANDING_PAGE_DASHBOARD = "dashboard"
    LANDING_PAGE_CALENDAR = "calendar"
    LANDING_PAGE_TASKS = "tasks"
    LANDING_PAGE_CHOICES = [
        (LANDING_PAGE_DASHBOARD, "Dashboard"),
        (LANDING_PAGE_CALENDAR, "Calendar"),
        (LANDING_PAGE_TASKS, "Tasks"),
    ]

    WEEK_STARTS_ON_MONDAY = "monday"
    WEEK_STARTS_ON_SUNDAY = "sunday"
    WEEK_STARTS_ON_CHOICES = [
        (WEEK_STARTS_ON_MONDAY, "Monday"),
        (WEEK_STARTS_ON_SUNDAY, "Sunday"),
    ]

    TIME_FORMAT_24H = "24h"
    TIME_FORMAT_12H = "12h"
    TIME_FORMAT_CHOICES = [
        (TIME_FORMAT_24H, "24-hour"),
        (TIME_FORMAT_12H, "12-hour"),
    ]

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
    day_schedule = models.JSONField(default=default_day_schedule)

    max_hours_study_per_day = models.PositiveSmallIntegerField(
        default=4, validators=[MinValueValidator(0), MaxValueValidator(24)]
    )
    max_days_ahead = models.PositiveSmallIntegerField(
        default=30, validators=[MinValueValidator(1), MaxValueValidator(365)]
    )
    drag_snap_minutes = models.PositiveSmallIntegerField(default=5)
    limit_max_hours = models.BooleanField(default=True)
    disable_sound_effects = models.BooleanField(default=False)
    default_landing_page = models.CharField(
        max_length=20,
        choices=LANDING_PAGE_CHOICES,
        default=LANDING_PAGE_DASHBOARD,
    )
    week_starts_on = models.CharField(
        max_length=10,
        choices=WEEK_STARTS_ON_CHOICES,
        default=WEEK_STARTS_ON_MONDAY,
    )
    time_format = models.CharField(
        max_length=3,
        choices=TIME_FORMAT_CHOICES,
        default=TIME_FORMAT_24H,
    )

    # Store as IANA timezone. Enables us to use timezone aware features (like adjusting for the clocks going forward or back).
    timezone = models.CharField(max_length=100, default="Europe/London")

    def clean(self):
        """Validate the timezone and weekly schedule to ensure they are in the correct format,
        and that the max hours per day does not exceed the available time in the schedule.

        Raises:
            ValidationError: If the timezone, schedule format, or the max study hours are invalid.
        """
        super().clean()
        allowed_drag_snap_minutes = {5, 10, 15, 20, 30, 60}
        if self.drag_snap_minutes not in allowed_drag_snap_minutes:
            raise ValidationError(
                {
                    "drag_snap_minutes": (
                        "Drag snap minutes must be one of: 5, 10, 15, 20, 30, 60."
                    )
                }
            )
        allowed_landing_pages = {
            self.LANDING_PAGE_DASHBOARD,
            self.LANDING_PAGE_CALENDAR,
            self.LANDING_PAGE_TASKS,
        }
        if self.default_landing_page not in allowed_landing_pages:
            raise ValidationError(
                {"default_landing_page": "Default landing page is not valid."}
            )

        allowed_week_starts_on = {
            self.WEEK_STARTS_ON_MONDAY,
            self.WEEK_STARTS_ON_SUNDAY,
        }
        if self.week_starts_on not in allowed_week_starts_on:
            raise ValidationError({"week_starts_on": "Week start is not valid."})

        allowed_time_formats = {
            self.TIME_FORMAT_24H,
            self.TIME_FORMAT_12H,
        }
        if self.time_format not in allowed_time_formats:
            raise ValidationError({"time_format": "Time format is not valid."})

        if self.timezone not in available_timezones():
            raise ValidationError({"timezone": "Timezone is not valid"})

        if self.day_end <= self.day_start:
            raise ValidationError({"day_end": "Day end must be after day start."})

        user_timezone = ZoneInfo(self.timezone)
        today = timezone.now().astimezone(user_timezone).date()

        schedule = self.day_schedule or []
        if not isinstance(schedule, list):
            raise ValidationError({"day_schedule": "Day schedule must be a list."})
        if len(schedule) != 7:
            raise ValidationError(
                {"day_schedule": "Provide a schedule for all 7 days."}
            )

        seen_days = set()
        max_minutes = self.max_hours_study_per_day * 60

        for entry in schedule:
            if not isinstance(entry, dict):
                raise ValidationError(
                    {"day_schedule": "Each day entry must be an object."}
                )

            day = entry.get("day")
            if not isinstance(day, int) or day < 1 or day > 7:
                raise ValidationError({"day_schedule": "Day must be between 1 and 7."})
            if day in seen_days:
                raise ValidationError({"day_schedule": "Duplicate day entries found."})
            seen_days.add(day)

            start_raw = entry.get("start")
            end_raw = entry.get("end")
            try:
                start_time = datetime.strptime(start_raw, "%H:%M").time()
                end_time = datetime.strptime(end_raw, "%H:%M").time()
            except (TypeError, ValueError):
                raise ValidationError(
                    {"day_schedule": "Start and end must be in HH:MM format."}
                )

            if end_time <= start_time:
                raise ValidationError(
                    {"day_schedule": "Each day must end after it starts."}
                )

            start_dt = datetime.combine(today, start_time, tzinfo=user_timezone)
            end_dt = datetime.combine(today, end_time, tzinfo=user_timezone)

            minutes_available = int((end_dt - start_dt).total_seconds() // 60)
            if self.limit_max_hours and max_minutes > minutes_available:
                raise ValidationError(
                    {
                        "max_hours_study_per_day": "Max task time exceeds your available day length."
                    }
                )

    def get_break_time(self):
        """Return the configured daily break time window as a string.

        Returns:
            str: The break time window.
        """
        return f"{self.day_start} - {self.day_end}"

    def get_day_window(self, target_date):
        """Get the available time frame for the user on a given date.
        Helps to determine when the user can be scheduled for tasks.

        Args:
            target_date (date): The date to get the time window for.

        Returns:
            tuple: A tuple containing the start and end time for the provided day.
        """
        day_key = target_date.weekday() + 1
        schedule = {}
        for entry in self.day_schedule or []:
            if not isinstance(entry, dict):
                continue
            day_value = entry.get("day")
            if isinstance(day_value, int):
                schedule[day_value] = entry
        entry = schedule.get(day_key)
        if entry and entry.get("start") and entry.get("end"):
            try:
                start_time = datetime.strptime(entry["start"], "%H:%M").time()
                end_time = datetime.strptime(entry["end"], "%H:%M").time()
                return start_time, end_time
            except (TypeError, ValueError):
                pass
        return self.day_start, self.day_end
