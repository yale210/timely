"""Admin configuration for the pomo application."""

from django.contrib import admin
from .models import PomoSession


@admin.register(PomoSession)
class PomoSessionAdmin(admin.ModelAdmin):
    """Admin interface configuration for PomoSession models.

    This class defines how the PomoSession model is displayed and interacted
    with in the Django admin panel.

    Attributes:
        list_display (tuple): Fields to display in the list view.
        list_filter (tuple): Fields that can be used to filter entries.
        search_fields (tuple): Fields that can be searched.
    """

    list_display = ("user", "duration_minutes", "completed_at", "created_at")
    list_filter = ("user", "completed_at")
    search_fields = ("user__username",)
