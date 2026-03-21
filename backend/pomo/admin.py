from django.contrib import admin
from .models import PomoSession


@admin.register(PomoSession)
class PomoSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "duration_minutes", "completed_at", "created_at")
    list_filter = ("user", "completed_at")
    search_fields = ("user__username",)
