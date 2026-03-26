"""Teacher model definition for the courses application.

This module defines the Teacher entity, which identifies users with instructional
and administrative leads over courses.
"""

from django.conf import settings
from django.db import models


class Teacher(models.Model):
    """Represents a teacher in the educational system.

    Teachers are primary leads for courses and have specific permissions to
    manage course content, events, and enrollments.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher",
        primary_key=True,
    )
    active = models.BooleanField(default=True)

    def __str__(self):
        """Returns a string identifying the teacher by their username."""
        return f"Teacher: {self.user.username}"
