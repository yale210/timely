from django.db import models
from .category import Category
from django.conf import settings
from django.utils.timezone import now
from django.core.validators import MinValueValidator, MaxValueValidator


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

    # 1 represents events of least importance.
    # 10 represents events of most importance.
    importance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )

    # If one-off event, use these fields.
    time = models.TimeField()
    date = models.DateField()

    # If recurring event, use these fields.
    recurring = models.BooleanField(default=False)
    recurring_start = models.DateField(null=True, blank=True)
    recurring_end = models.DateField(null=True, blank=True)
    recurring_interval = models.CharField(max_length=20, null=True, blank=True)

    # Calculate the time left of the event.
    # If event is recurring, return days between now and end date.
    # If event is a one off, return days between date and now.
    def calculateTimeLeft(self):
        current_time = now().date()

        if self.recurring and self.recurring_end:
            days_left = (self.recurring_end - current_time).days
            return max(days_left, 0)
        elif not self.recurring and self.date:
            days_left = (self.date - current_time).days
            return max(days_left, 0)
        else:
            return 0
