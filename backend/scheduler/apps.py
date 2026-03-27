"""Django app configuration for the scheduler package."""

from django.apps import AppConfig


class SchedulerConfig(AppConfig):
    """Configuration class for the scheduler application.

    This class defines the default auto-field and the name of the application.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "scheduler"
