from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from courses.models import (
    Course,
    CourseEnrollment,
    CourseEvent,
    CourseStaff,
    Student,
    Teacher,
)
from courses.models.course import CourseJoinCode


@admin.register(CourseStaff)
class CourseStaffAdmin(admin.ModelAdmin):
    list_display = ("course", "student", "active", "assigned_at")
    list_filter = ("active", "course")
    search_fields = ("course__name", "student__username", "student__email")
    autocomplete_fields = ("course", "student")
    list_editable = ("active",)


@admin.action(description="Expire selected join codes")
def expire_selected_codes(modeladmin, request, queryset):
    queryset.update(active=False, expires_at=timezone.now())


@admin.register(CourseJoinCode)
class CourseJoinCodeAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "course",
        "active",
        "expires_at",
        "created_at",
        "copy_join_url",
    )
    list_filter = ("active", "course", "expires_at")
    search_fields = ("code", "course__name")
    ordering = ("-created_at",)
    autocomplete_fields = ("course",)
    list_editable = ("active",)
    date_hierarchy = "created_at"
    actions = [expire_selected_codes]

    @admin.display(description="Join URL")
    def copy_join_url(self, obj):
        join_url = "/courses/join-by-code/"
        return format_html(
            '<span title="POST {} with code={}">Copy join URL</span>',
            join_url,
            obj.code,
        )


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    search_fields = ("name", "description")


admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(CourseEnrollment)
admin.site.register(CourseEvent)
