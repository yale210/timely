from django.db import models
from django.conf import settings


class Commute(models.Model):
    """Model used to allow for user commutes to be stored.
    It is assumed a user may have multiple commutes a day.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="commute"
    )
    commute_start = models.TimeField()
    commute_end = models.TimeField()

    def __str__(self):
        return f"{self.commute_start} - {self.commute_end}"
