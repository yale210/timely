from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.timezone import now

from .category import Category
from .importance_choices import ImportanceChoices


class Event(models.Model):
    """
    Model used to allow for events to be created.
    Events can be one-off, or recurring and with set intervals.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="events"
    )

    event_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_category",
    )

    importance = models.PositiveSmallIntegerField(
        choices=ImportanceChoices.choices,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )

    # If one-off event, use these fields.
    time = models.TimeField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)

    # If recurring event, use these fields.
    recurring = models.BooleanField(default=False)
    recurring_start = models.DateField(null=True, blank=True)
    recurring_end = models.DateField(null=True, blank=True)

    class RecurrenceInterval(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    recurring_interval = models.CharField(
        max_length=20, choices=RecurrenceInterval.choices, null=True, blank=True
    )

    def clean(self):
        errors = {}
        if self.recurring:
            if not self.recurring_start:
                errors["recurring_start"] = "Recurring events require a start date."
            if not self.recurring_end:
                errors["recurring_end"] = "Recurring events require an end date."
            if not self.recurring_interval:
                errors["recurring_interval"] = "Recurring events require an interval."
        else:
            if not self.time:
                errors["time"] = "One-off events require a time."
            if not self.date:
                errors["date"] = "One-off events require a date."
            if self.recurring_start:
                errors["recurring_start"] = "One-off events cannot set a start date."
            if self.recurring_end:
                errors["recurring_end"] = "One-off events cannot set an end date."
            if self.recurring_interval:
                errors["recurring_interval"] = (
                    "One-off events cannot set a recurring interval."
                )
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    # Calculate the time left of the event.
    # If event is recurring, return days between now and end date.
    # If event is a one off, return days between date and now.
    def calculate_time_left(self):
        current_time = now().date()
        if self.recurring and self.recurring_end:
            return max((self.recurring_end - current_time).days, 0)
        if not self.recurring and self.date:
            return max((self.date - current_time).days, 0)
        return 0
