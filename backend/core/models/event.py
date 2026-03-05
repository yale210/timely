from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from .base_event import BaseEventModel
from .category import Category
from zoneinfo import ZoneInfo
from django.utils import timezone


class Event(BaseEventModel):
    """
    Model used to allow for events to be created.
    Events can be one-off, or recurring and with set intervals.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="events"
    )

    categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name="events",
    )

    class RecurrenceInterval(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    recurrence_interval = models.CharField(
        max_length=20, choices=RecurrenceInterval.choices, null=True, blank=True
    )
    recurrence_end = models.DateField(null=True, blank=True)
    exception_dates = models.JSONField(default=list, blank=True)
    split_from_event = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="split_child_events",
    )

    def clean(self):
        super().clean()
        errors = {}

        # If recurrence_end is provided, it must have an interval
        if self.recurrence_end and not self.recurrence_interval:
            errors["recurrence_interval"] = "Recurring events require an interval."

        # If recurrence_end is provided, validate it's after start_time
        if self.recurrence_end and self.start_time:
            if self.recurrence_end < self.start_time.date():
                errors["recurrence_end"] = (
                    "Recurrence end date must be after or equal to start date."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def calculate_time_left(self):
        """
        Calculate the time left of the event.
        If event is recurring, return days between now and recurrence end date.
        If event is a one off, return days between start_time and now.
        """

        # If user doesn't  have a preference, we don't know their timezone so return 0
        if not hasattr(self.user, "preference") or not self.user.preference.timezone:
            return 0

        user_timezone = ZoneInfo(self.user.preference.timezone)
        today = timezone.now().astimezone(user_timezone).date()

        if self.recurrence_interval and self.recurrence_end:
            return max((self.recurrence_end - today).days, 0)

        # DB uses UTC, convert to correct timezone first.
        if self.start_time:
            start_time = self.start_time.astimezone(user_timezone).date()
            return max((start_time - today).days, 0)

        return 0
    