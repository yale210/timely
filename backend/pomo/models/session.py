from django.db import models
from django.conf import settings

class PomoSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pomo_sessions")
    duration_minutes = models.IntegerField()
    completed_at = models.DateTimeField()
    created_at = models.DateTimeField(db_index=True, auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]

    def __str__(self):
        return f"{self.user.username} - {self.duration_minutes} mins at {self.completed_at}"
