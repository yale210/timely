"""Configuration for the admin_panel Django app."""

from django.apps import AppConfig


class AdminPanelConfig(AppConfig):
    """Configuration class for the admin_panel application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "admin_panel"
