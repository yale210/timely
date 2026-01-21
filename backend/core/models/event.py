from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

# Events: USERID, Event ID, time, date, importance, Recurring/not recurring (e.g. one-off) and how often its recurring and for how long


class Event(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="events"
    )

    event_category = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="category",
    )

    time = models.TimeField()
    date = models.DateField()
    # 1 least important, 10 insanely urgent
    importance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    recurring = models.BooleanField(default=False)
    recurring_start = models.DateField()
    recurring_end = models.DateField()

    def calculateTimeLeft(self):
        if self.recurring_start is not None and self.recurring_start is not None:
            return (self.recurring_end - self.recurring_start).days
        else:
            return 0
