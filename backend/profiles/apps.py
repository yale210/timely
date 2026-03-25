"""Django app configuration for the profiles package."""

from importlib import import_module
from django.apps import AppConfig


class ProfilesConfig(AppConfig):
    """Register the profiles app with Django."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "profiles"

    def ready(self):
        """Run app startup hooks for the profiles package."""
        import_module("profiles.signals.xp_signal")
