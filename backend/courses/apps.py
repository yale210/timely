"""Configuration for the courses Django application.

This module defines the configuration class for the courses app, which manages
course entities, student enrollments, and teacher assignments.
"""

from django.apps import AppConfig


class CoursesConfig(AppConfig):
    """AppConfig for the courses application.

    Sets the default auto field and application name for Django's registry.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "courses"
