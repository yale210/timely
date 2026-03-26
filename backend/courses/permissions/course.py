"""Detailed permission logic for course-related entities and actions.

This module contains the `CoursePermission` class, which handles granular access
checks for viewing, updating, joining, and managing staff or events within a course.
It reconciles different user roles (admin, lead, staff, student) against specific
DRF view actions.
"""

from rest_framework.permissions import BasePermission

from courses.models.course import CourseEnrollment, CourseStaff
from courses.permissions.TeacherPermission import IsTeacher


class CoursePermission(BasePermission):
    """Main permission class for all Course-related API endpoints.

    Evaluates permissions based on the user's relationship with a course instance.
    Supports role-based access for teachers, students, and course-specific staff.
    """

    def _is_admin(self, request):
        """Checks if the user has administrative privileges (staff or superuser).

        Args:
            request: The current HttpRequest object.

        Returns:
            True if the user is an authenticated admin.
        """
        return bool(
            request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )

    def _is_lead(self, request, course):
        """Checks if the user is the primary lead teacher for the course.

        Args:
            request: The current HttpRequest object.
            course: The Course instance to check against.

        Returns:
            True if the user is the lead of the course.
        """
        return bool(
            request.user.is_authenticated
            and course.lead_id
            and course.lead.user_id == request.user.id
        )

    def _is_staff(self, request, course):
        """Checks if the user is assigned as staff for the specific course.

        Args:
            request: The current HttpRequest object.
            course: The Course instance to check against.

        Returns:
            True if the user is an active staff member for the course.
        """
        return bool(
            request.user.is_authenticated
            and CourseStaff.objects.filter(
                course=course,
                student=request.user,
                active=True,
            ).exists()
        )

    def _is_enrolled(self, request, course):
        """Checks if the user is currently enrolled as a student in the course.

        Args:
            request: The current HttpRequest object.
            course: The Course instance to check against.

        Returns:
            True if the user is actively enrolled.
        """
        return bool(
            request.user.is_authenticated
            and CourseEnrollment.objects.filter(
                course=course,
                student__user=request.user,
                active=True,
            ).exists()
        )

    def _get_action(self, view):
        """Retrieves the current action name from the DRF view.

        Args:
            view: The View instance being accessed.

        Returns:
            The string name of the action (e.g., 'list', 'retrieve').
        """
        return getattr(view, "action", None)

    def can_view_course_details(self, request, course):
        """Determines if the user can see non-public details of a course.

        Accessible by admins, leads, staff, and enrolled students.

        Args:
            request: The current HttpRequest object.
            course: The Course instance.

        Returns:
            True if access is granted.
        """
        return (
            self._is_admin(request)
            or self._is_enrolled(request, course)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_view_events(self, request, course):
        """Determines if the user can view scheduled events for the course.

        Follows the same logic as viewing course details.

        Args:
            request: The current HttpRequest object.
            course: The Course instance.

        Returns:
            True if access is granted.
        """
        return self.can_view_course_details(request, course)

    def can_create_join_code(self, request, course):
        """Determines if the user has permission to generate new join codes.

        Restricted to admins, course staff, and the course lead.

        Args:
            request: The current HttpRequest object.
            course: The Course instance.

        Returns:
            True if access is granted.
        """
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_change_name(self, request, course):
        """Determines if the user can rename the course.

        Restricted to admins and the primary course lead.

        Args:
            request: The current HttpRequest object.
            course: The Course instance.

        Returns:
            True if access is granted.
        """
        return self._is_admin(request) or self._is_lead(request, course)

    def can_change_description(self, request, course):
        """Determines if the user can update the course description.

        Accessible by admins, staff, and leads.

        Args:
            request: The current HttpRequest object.
            course: The Course instance.

        Returns:
            True if access is granted.
        """
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_update_course(self, request, course):
        """Determines if the user has general update permissions for the course.

        Follows standard instructional management permission logic.

        Args:
            request: The current HttpRequest object.
            course: The Course instance.

        Returns:
            True if access is granted.
        """
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def has_permission(self, request, view):
        """Performs initial level permission checks for the given request and view.

        Specifically handles global actions like 'create' and generic actions that
        don't require an object instance yet (like 'list').

        Args:
            request: The current HttpRequest object.
            view: The View instance being accessed.

        Returns:
            True if the initial access is allowed.
        """
        if self._get_action(view) in ["permissions"]:
            return True
        if not request.user.is_authenticated:
            return False

        if self._is_admin(request):
            return True

        action = self._get_action(view)

        if action is None:
            return True

        if action == "list":
            return True

        if action == "create":
            return IsTeacher().has_permission(request, view)

        if action in [
            "retrieve",
            "events",
            "join",
            "leave",
            "staff",
            "join_code",
            "join_by_code",
            "update",
            "partial_update",
            "destroy",
        ]:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Performs instance-level permission checks.

        Analyzes the specific action being performed on a Course object and
        evaluates if the user's role satisfies the required level of access.

        Args:
            request: The current HttpRequest object.
            view: The View instance.
            obj: The specific Course object being accessed.

        Returns:
            True if the user is authorized to perform the action on this object.
        """
        if not request.user.is_authenticated:
            return False
        if self._get_action(view) in ["permissions"]:
            return True

        action = self._get_action(view)

        if self._is_admin(request):
            return True

        if action == "retrieve":
            return self.can_view_course_details(request, obj)

        if action == "events":
            return self.can_view_events(request, obj)

        if action == "join_code":
            return self.can_create_join_code(request, obj)

        if action in ["update", "partial_update"]:
            return self.can_update_course(request, obj)

        if action == "destroy":
            return self._is_lead(request, obj) or self._is_admin(request)

        if action == "staff":
            return self._is_lead(request, obj) or self._is_admin(request)

        if action in ["join", "leave"]:
            return True

        return False
