"""Lego profile model definitions."""

from django.db import models
from django.conf import settings


class Profile(models.Model):
    """Store legacy profile data linked to a user.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    date_of_birth = models.DateField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Return a string representation of the profile.

        Returns:
            str: A string representation of the profile.
        """
        return str(self.user)
