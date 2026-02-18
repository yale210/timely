from django.contrib import admin

from .models import Category, Grade, Task


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
