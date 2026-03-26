"""Reccuring events override model definitions."""

from django.db import models

from .base_event import BaseEventModel
from .category import Category
from .event import Event


class EventOverride(BaseEventModel):
<<<<<<< HEAD
    """Stores an override for a specific occurrence of a recurring event.
    """
=======
    """Stores an override for a specific occurrence of a recurring event."""
>>>>>>> 5ded433200bfe3694b6104f0db9d21c3d5fd874f

    parent_event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="overrides",
    )
    original_start_time = models.DateTimeField(db_index=True)
    categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name="event_overrides",
    )
    reminders_snapshot = models.JSONField(default=list, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["parent_event", "original_start_time"],
                name="unique_event_override_anchor",
            )
        ]

    def save(self, *args, **kwargs):
        """Run validation for the model before saving.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            EventOverride: The saved event's override instance.
        """
        self.full_clean()
        return super().save(*args, **kwargs)
