from datetime import timedelta
from django.db import models


class EventReminder(models.Model):
    event = models.ForeignKey(
        "Event", related_name="reminders", on_delete=models.CASCADE
    )
    send_email = models.BooleanField(default=False)
    send_push = models.BooleanField(default=False)
    minutes_before = models.PositiveIntegerField()

    trigger_at = models.DateTimeField(editable=False)
    processed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.event and self.event.start_time:
            self.trigger_at = self.event.start_time - timedelta(
                minutes=self.minutes_before
            )
        super().save(*args, **kwargs)
