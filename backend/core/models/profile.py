from django.db import models
from django.conf import settings


class Profile(models.Model):
    """
    This model is used to add additional functionality to Django's built in User feature.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    date_of_birth = models.DateField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    # Retrieve the user's username.
    def __str__(self):
        return str(self.user)
