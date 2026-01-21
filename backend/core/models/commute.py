from django.db import models
from django.conf import settings
from datetime import datetime,date
from django.core.validators import MinValueValidator, MaxValueValidator

# Stores a commute of a user. A user may have multiple a day.
class Commute(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE, 
        related_name='commute'
    )
    commute_start = models.TimeField()
    commute_end = models.TimeField()

    def __str__(self):
        return(f"{self.commute_start} - {self.commute_end}")