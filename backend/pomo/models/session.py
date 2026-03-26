"""Database models for the pomo application."""

from django.db import models
from django.conf import settings


class PomoSession(models.Model):

    """Model representing a completed Pomodoro session.
    
    This model stores information about a user's focus session, including
    its duration and completion time.
    
    Attributes:
        user (ForeignKey): Reference to the user who completed the session.
        duration_minutes (PositiveIntegerField): The length of the session in minutes.
        completed_at (DateTimeField): The exact time the session was completed.
        created_at (DateTimeField): The timestamp when the record was created in the database.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pomo_sessions"
    )
    duration_minutes = models.PositiveIntegerField()
    completed_at = models.DateTimeField()
    created_at = models.DateTimeField(db_index=True, auto_now_add=True)

    class Meta:

        """Metadata options for the PomoSession model."""
        ordering = ["-completed_at"]

    def __str__(self):
        """Return a string representation of the session.
        
        Returns:
            str: A formatted string containing the username, duration, and completion time.
        """
        return f"{self.user.username} - {self.duration_minutes} mins at {self.completed_at}"
