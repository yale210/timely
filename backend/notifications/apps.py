"""Application configuration for the notifications app."""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """Configuration class for the notifications Django application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        """Perform initialization tasks when the app is ready.

        This includes importing signals to ensure they are registered.
        """
        # Import signals to register signal handlers
        import notifications.signals  # noqa: F401
