"""Application configurations for the pomo application."""

from django.apps import AppConfig


class PomoConfig(AppConfig):
    """Configuration settings for the pomo application.

    This class initialises and sets up configurations tailored to the
    Pomodoro features of the backend.

    Attributes:
        default_auto_field (str): The default primary key field type.
        name (str): The name of the application.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "pomo"
