"""Authentication app components."""
from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    """Configure the authentication Django application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "authentication"
