"""Pending event share model definitions."""

from django.conf import settings
from django.db import models

from .event import Event


class PendingShareEvent(models.Model):
    """Model to store pending event shares between users.

    Allows for the tracking of event shares, enabling collaboration and sharing of events between users.
    """

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent"
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received"
    )

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="shared_Events"
    )

    class Meta:
        """Prevent duplicate share requests for the same sender/receiver/event tuple."""

        unique_together = ("sender", "receiver", "event")
