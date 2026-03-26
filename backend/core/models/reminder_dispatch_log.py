""" "Reminder dispatch log model definitions."""

from django.db import models

from .event import Event


class ReminderDispatchLog(models.Model):
    """Record reminder dispatches to make sure no duplicates are sent for the same event.
    """

    source_event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="reminder_dispatches",
    )
    original_start_time = models.DateTimeField()
    reminder_signature = models.CharField(max_length=64)
    dispatched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source_event", "original_start_time", "reminder_signature"],
                name="unique_reminder_dispatch_for_occurrence",
            )
        ]
