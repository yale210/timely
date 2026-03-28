"""Admin configuration for the courses application.

This module defines the administrative interface for managing courses, enrollments,
staff assignments, and join codes. It leverages Django's admin framework to provide
a user-friendly way to oversee the educational structure and access control.
"""

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
    """Admin interface for managing course staff assignments.

    Provides tools for listing and filtering staff members by their active status
    and the courses they are assigned to. Supports autocomplete for quick lookups
    of courses and students.
    """

    list_display = ("course", "student", "active", "assigned_at")
    list_filter = ("active", "course")
    search_fields = ("course__name", "student__username", "student__email")
    autocomplete_fields = ("course", "student")
    list_editable = ("active",)


@admin.action(description="Expire selected join codes")
def expire_selected_codes(modeladmin, request, queryset):
    """Administrative action to immediately deactivate selected join codes.

    Updates the `active` status to False and sets the `expires_at` timestamp to
    the current time for all join codes in the provided queryset.

    Args:
        modeladmin: The ModelAdmin instance.
        request: The current HttpRequest object.
        queryset: A QuerySet of CourseJoinCode instances selected by the admin.
    """
    queryset.update(active=False, expires_at=timezone.now())


@admin.register(CourseJoinCode)
class CourseJoinCodeAdmin(admin.ModelAdmin):
    """Admin interface for managing course join codes.

    Allows administrators to create, monitor, and expire codes used for course
    enrollment. Includes a utility to display the join URL associated with each code.
    """

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
        """Generates a formatted HTML snippet showing the join endpoint.

        This helper provides visual feedback in the admin list view about the
        expected API interaction for the specific join code.

        Args:
            obj: The CourseJoinCode instance being rendered.

        Returns:
            A string of safe HTML containing the join path and the code.
        """
        join_url = "/courses/join-by-code/"
        return format_html(
            '<span title="POST {} with code={}">Copy join URL</span>',
            join_url,
            obj.code,
        )


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin interface for managing core Course entities.

    Enables searching through courses by their name and description to facilitate
    quick management of the primary academic units in the system.
    """

    search_fields = ("name", "description")


admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(CourseEnrollment)
admin.site.register(CourseEvent)
