from django.core.exceptions import ValidationError
from django.db import models
from django.utils.timezone import now


class BaseEventModel(models.Model):
    title = models.CharField(max_length=500, default="Untitled Event")
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    colour = models.CharField(max_length=7, blank=True, null=True)
    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(default=now)

    class Meta:
        abstract = True

    def clean(self):
        if self.start_time and self.end_time and self.end_time < self.start_time:
            raise ValidationError(
                {"end_time": "End time must be after or equal to start time."}
            )
