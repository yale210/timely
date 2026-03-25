from django.conf import settings
from django.db import models
from .event import Event


class PendingShareEvent(models.Model):
    # The person that sent the event
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent"
    )
    # This user can accept or reject this event
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received"
    )
    # The actual event being shared
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="shared_Events"
    )

    # Ensures that only 1 of the same event can be shared to each user (you can't send 100x events to someone etc)
    class Meta:
        unique_together = ("sender", "receiver", "event")
