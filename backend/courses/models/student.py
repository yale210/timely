"""Student model definition for the courses application.

This module defines the Student entity, which links a system user to course-related
activities and enrollments.
"""

from django.conf import settings
from django.db import models


class Student(models.Model):
    """Represents a student in the educational system.

    Acts as a profile extension for a standard User, specifically identifying
    them within the context of academic courses and enrollments.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student"
    )

    def __str__(self):
        """Returns a constant string prefix for the student representation."""
        return "Student:"
