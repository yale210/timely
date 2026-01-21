from django.db import models
from django.conf import settings

# READ ME:
# We will be using django's built in user.
# This has auth, passwords, permissions, login, admin, etc
# Profile will be a wrapper for small extra features. #
# This saves us rebuilding the same features which are already provided by django
# and shows we actually understand django


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    date_of_birth = models.DateField(null=True, blank=True)
    creation_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.user.username
