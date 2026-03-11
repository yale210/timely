from django.contrib import admin

from .models import Category, Event, EventOverride, Grade, ReminderDispatchLog, Task


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("text",)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "category",
        "score",
        "total_possible",
        "date_achieved",
    )
    search_fields = ("name", "user__username")
    list_filter = ("date_achieved", "category")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "deadline",
        "completed",
        "importance",
        "get_categories",
        "estimated_minutes",
    )
    list_filter = ("completed", "importance", "categories")
    search_fields = ("title", "user__username")
    raw_id_fields = ("parent_task",)

    @admin.display(description="Categories")
    def get_categories(self, obj):
        return ", ".join([c.text for c in obj.categories.all()])


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "start_time", "end_time", "recurrence_interval")
    list_filter = ("recurrence_interval",)
    search_fields = ("title", "user__username")


@admin.register(EventOverride)
class EventOverrideAdmin(admin.ModelAdmin):
    list_display = ("title", "parent_event", "original_start_time", "start_time")
    search_fields = ("title", "parent_event__title", "parent_event__user__username")


@admin.register(ReminderDispatchLog)
class ReminderDispatchLogAdmin(admin.ModelAdmin):
    list_display = ("source_event", "original_start_time", "dispatched_at")
    search_fields = ("source_event__title", "source_event__user__username")
