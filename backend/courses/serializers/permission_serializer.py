"""Serializers for course-specific permission data.

This module provides a serializer that calculates and represents the set of
actions a specific user is permitted to perform on a given course instance.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.permissions.course_permission import CoursePermission

User = get_user_model()


class PermissionsSerializer(serializers.Serializer):
    """Serializer that maps course-specific permission checks to boolean flags.

    Used to communicate to the frontend which UI elements or actions should be
    available to the current user for a particular course.
    """

    can_view_course_details = serializers.BooleanField(read_only=True)
    can_view_events = serializers.BooleanField(read_only=True)
    can_create_join_code = serializers.BooleanField(read_only=True)
    can_change_name = serializers.BooleanField(read_only=True)
    can_change_description = serializers.BooleanField(read_only=True)
    can_update_course = serializers.BooleanField(read_only=True)
    can_destroy_course = serializers.BooleanField(read_only=True)
    can_manage_staff = serializers.BooleanField(read_only=True)
    can_join = serializers.BooleanField(read_only=True)
    can_leave = serializers.BooleanField(read_only=True)

    def to_representation(self, course):
        """Converts the course instance into a set of permission flags.

        Args:
            course: The Course model instance being queried.

        Returns:
            A dictionary where each key is a permission type and the value is a boolean.
        """
        request = self.context["request"]
        perm = CoursePermission()

        return {
            "can_view_course_details": perm.can_view_course_details(request, course),
            "can_view_events": perm.can_view_events(request, course),
            "can_create_join_code": perm.can_create_join_code(request, course),
            "can_change_name": perm.can_change_name(request, course),
            "can_change_description": perm.can_change_description(request, course),
            "can_update_course": perm.can_update_course(request, course),
            "can_destroy_course": perm._is_admin(request)
            or perm._is_lead(request, course),
            "can_manage_staff": perm._is_admin(request)
            or perm._is_lead(request, course),
            "can_join": True,
            "can_leave": True,
        }
