from django.conf import settings
from django.db import models


class Student(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student"
    )

    def __str__(self):
        return "Student:"
