"""Permission classes for teacher-specific operations.

This module provides custom DRF permissions to restrict access to endpoints that
should only be reachable by active teachers or system administrators.
"""

from rest_framework.permissions import BasePermission

from courses.models.teacher import Teacher


class IsTeacher(BasePermission):
    """Permission class to check if a user is an active teacher.

    Restricts access to authenticated users who have an active Teacher profile
    or possess superuser status.
    """

    message = "Only teachers are allowed to perform this action"

    def has_permission(self, request, view):
        """Checks if the requesting user has teacher-level access.

        Args:
            request: The current HttpRequest object.
            view: The View instance being accessed.

        Returns:
            True if the user is an active teacher or superuser, False otherwise.
        """
        if request.user.is_authenticated:
            return (
                Teacher.objects.filter(user=request.user, active=True).exists()
                or request.user.is_superuser
            )
        return False
