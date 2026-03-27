"""Model for user commutes."""

from django.conf import settings
from django.db import models


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
        """Return the commute window.

        Returns:
            str: The commute start and end time.

        """
        return f"{self.commute_start} - {self.commute_end}"
