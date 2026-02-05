from datetime import timedelta
from django.db import models


class EventReminder(models.Model):
    class Type(models.TextChoices):
        EMAIL = "email", "Email"
        POPUP = "popup", "Popup"

    event = models.ForeignKey(
        "Event", related_name="reminders", on_delete=models.CASCADE
    )
    type = models.CharField(max_length=10, choices=Type.choices, default=Type.POPUP)
    minutes_before = models.PositiveIntegerField()
    trigger_at = models.DateTimeField(editable=False)
    processed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.event and self.event.start_time:
            self.trigger_at = self.event.start_time - timedelta(
                minutes=self.minutes_before
            )
        super().save(*args, **kwargs)
