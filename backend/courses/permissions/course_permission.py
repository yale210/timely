"""Permission classes for course views and actions."""

from rest_framework.permissions import BasePermission

from courses.models.course import CourseEnrollment, CourseStaff
from courses.permissions.teacher_permission import IsTeacher


class CoursePermission(BasePermission):
    """Permission class for course views and actions."""

    def _is_admin(self, request):
        """Return whether the request user has admin privileges.

        Args:
            request: The incoming DRF request.

        Returns:
            bool: ``True`` when the request user is staff or a superuser.
        """
        return bool(
            request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )

    def _is_lead(self, request, course):
        """Return whether the request user leads the course.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user is the course lead.
        """
        return bool(
            request.user.is_authenticated
            and course.lead_id
            and course.lead.user_id == request.user.id
        )

    def _is_staff(self, request, course):
        """Return whether the request user is active course staff.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user is active course staff.
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
        """Return whether the request user is actively enrolled in the course.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user has an active enrollment.
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
        """Return the current view action.

        Args:
            view: The DRF view being evaluated.

        Returns:
            str | None: The current view action, if present.
        """
        return getattr(view, "action", None)

    def can_view_course_details(self, request, course):
        """Return whether the request user can view course details.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user can view course details.
        """
        return (
            self._is_admin(request)
            or self._is_enrolled(request, course)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_view_events(self, request, course):
        """Return whether the request user can view course events.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user can view course events.
        """
        return self.can_view_course_details(request, course)

    def can_create_join_code(self, request, course):
        """Return whether the request user can create join codes.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user can create join codes.
        """
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_change_name(self, request, course):
        """Return whether the request user can change the course name.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user can change the course name.
        """
        return self._is_admin(request) or self._is_lead(request, course)

    def can_change_description(self, request, course):
        """Return whether the request user can change the course description.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user can change the course description.
        """
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_update_course(self, request, course):
        """Return whether the request user can update the course.

        Args:
            request: The incoming DRF request.
            course: The course instance being evaluated.

        Returns:
            bool: ``True`` when the request user can update the course.
        """
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def has_permission(self, request, view):
        """Return whether the request can reach the current course action.

        Args:
            request: The incoming DRF request.
            view: The DRF view being evaluated.

        Returns:
            bool: ``True`` when the request passes non-object permission checks.
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
        """Return whether the request can act on the given course object.

        Args:
            request: The incoming DRF request.
            view: The DRF view being evaluated.
            obj: The course instance being accessed.

        Returns:
            bool: ``True`` when the request has object-level permission.
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
