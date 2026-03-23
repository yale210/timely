"""Models for user notifications."""

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """Represents a single notification sent to a user."""

    class NotificationType(models.TextChoices):
        """Supported notification categories."""

        SYSTEM = "SYSTEM", "System"
        TASK = "TASK", "Task"
        CALENDAR = "CALENDAR", "Calendar"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )

    class Meta:
        """Meta options for Notification."""

        ordering = ["-timestamp"]
        db_table = "core_notification"

    def __str__(self):
        """String representation of a Notification."""
        return self.title[:50]
