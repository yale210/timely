"""Preference model definitions."""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, available_timezones

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
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

    # Store as IANA timezone. Enables us to use timezone aware features (like adjusting for the clocks going forward or back).
    timezone = models.CharField(max_length=100, default="Europe/London")

    def _validate_drag_snap_minutes(self):
        allowed_drag_snap_minutes = {5, 10, 15, 20, 30, 60}
        if self.drag_snap_minutes not in allowed_drag_snap_minutes:
            raise ValidationError(
                {
                    "drag_snap_minutes": (
                        "Drag snap minutes must be one of: 5, 10, 15, 20, 30, 60."
                    )
                }
            )

    def _validate_timezone(self):
        if self.timezone not in available_timezones():
            raise ValidationError({"timezone": "Timezone is not valid"})

    def _validate_day_bounds(self):
        if self.day_start == self.day_end:
            raise ValidationError({"day_end": "Day start and end must be different."})

    def _get_day_schedule_entries(self):
        schedule = self.day_schedule or []
        if not isinstance(schedule, list):
            raise ValidationError({"day_schedule": "Day schedule must be a list."})
        if len(schedule) != 7:
            raise ValidationError(
                {"day_schedule": "Provide a schedule for all 7 days."}
            )
        return schedule

    def _validate_day_entry(self, entry, seen_days):
        if not isinstance(entry, dict):
            raise ValidationError({"day_schedule": "Each day entry must be an object."})

        day = entry.get("day")
        if not isinstance(day, int) or day < 1 or day > 7:
            raise ValidationError({"day_schedule": "Day must be between 1 and 7."})
        if day in seen_days:
            raise ValidationError({"day_schedule": "Duplicate day entries found."})
        return day

    def _parse_schedule_time(self, value):
        try:
            return datetime.strptime(value, "%H:%M").time()
        except (TypeError, ValueError) as exc:
            raise ValidationError(
                {"day_schedule": "Start and end must be in HH:MM format."}
            ) from exc

    def _get_available_minutes(self, entry, today, user_timezone):
        start_time = self._parse_schedule_time(entry.get("start"))
        end_time = self._parse_schedule_time(entry.get("end"))
        if start_time == end_time:
            raise ValidationError({"day_schedule": "Start and end must be different."})

        start_dt = datetime.combine(today, start_time, tzinfo=user_timezone)
        end_dt = datetime.combine(today, end_time, tzinfo=user_timezone)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)

        return int((end_dt - start_dt).total_seconds() // 60)

    def _validate_max_hours_against_schedule(self, minutes_available, max_minutes):
        if self.limit_max_hours and max_minutes > minutes_available:
            raise ValidationError(
                {
                    "max_hours_study_per_day": "Max task time exceeds your available day length."
                }
            )

    def _validate_day_schedule(self):
        user_timezone = ZoneInfo(self.timezone)
        today = timezone.now().astimezone(user_timezone).date()
        seen_days = set()
        max_minutes = self.max_hours_study_per_day * 60

        for entry in self._get_day_schedule_entries():
            day = self._validate_day_entry(entry, seen_days)
            seen_days.add(day)
            minutes_available = self._get_available_minutes(entry, today, user_timezone)
            self._validate_max_hours_against_schedule(minutes_available, max_minutes)

    def clean(self):
        """Validate the timezone and weekly schedule to ensure they are in the correct format.

        and that the max hours per day does not exceed the available time in the schedule.
        """
        super().clean()
        self._validate_drag_snap_minutes()
        self._validate_timezone()
        self._validate_day_bounds()
        self._validate_day_schedule()

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
