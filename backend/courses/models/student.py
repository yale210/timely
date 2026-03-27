"""Student model definitions for courses."""

from django.conf import settings
from django.db import models


class Student(models.Model):
    """Model for student records in the courses app."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student"
    )

    def __str__(self):
        """Return the string representation of the object."""
        return "Student:"
