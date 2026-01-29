from django.contrib import admin

from .models import Grade, Category, Task


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
        "task_message",
        "user",
        "deadline",
        "completed",
        "importance",
        "task_category",
        "estimated_minutes",
    )
    list_filter = ("completed", "importance", "task_category")
    search_fields = ("task_message", "user__username")
    raw_id_fields = ("parent_task",)
