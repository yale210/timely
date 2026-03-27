"""Permission class for teacher-only access."""

from rest_framework.permissions import BasePermission

from courses.models.teacher import Teacher


class IsTeacher(BasePermission):
    """Permission class for teacher-only access."""

    message = "Only teachers are allowed to perform this action"

    def has_permission(self, request, view):
        """Return whether the request user can access teacher-only actions.

        Args:
            request: The incoming DRF request.
            view: The DRF view being evaluated.

        Returns:
            bool: ``True`` when the user is an active teacher or superuser.
        """
        if request.user.is_authenticated:
            return (
                Teacher.objects.filter(user=request.user, active=True).exists()
                or request.user.is_superuser
            )
        return False
