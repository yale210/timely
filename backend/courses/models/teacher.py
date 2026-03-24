from django.conf import settings
from django.db import models


class Teacher(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teacher", primary_key=True
    )
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"Teacher: {self.user.username}"
