"""Models for Web Push subscriptions."""

from django.conf import settings
from django.db import models


class PushSubscription(models.Model):
    """Represents a user's browser subscription for Web Push notifications."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    endpoint = models.URLField(max_length=500)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta options for PushSubscription."""

        unique_together = ("user", "endpoint")
        db_table = "core_pushsubscription"

    def __str__(self):
        """String representation of a PushSubscription."""
        return f"PushSubscription for {self.user.username}"
