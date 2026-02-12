from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.timezone import now

from .category import Category


class Event(models.Model):
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

    title = models.CharField(max_length=500, default="Untitled Event")
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)

    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(default=now)

    class RecurrenceInterval(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    recurrence_interval = models.CharField(
        max_length=20, choices=RecurrenceInterval.choices, null=True, blank=True
    )
    recurrence_end = models.DateField(null=True, blank=True)

    def clean(self):
        errors = {}
        if self.start_time and self.end_time and self.end_time < self.start_time:
            errors["end_time"] = "End time must be after or equal to start time."

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
        current_date = now().date()
        if self.recurrence_interval and self.recurrence_end:
            return max((self.recurrence_end - current_date).days, 0)
        if self.start_time:
            return max((self.start_time.date() - current_date).days, 0)
        return 0
