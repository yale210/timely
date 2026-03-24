from rest_framework.permissions import BasePermission

from courses.models.course import CourseEnrollment, CourseStaff
from courses.permissions.TeacherPermission import IsTeacher


class CoursePermission(BasePermission):
    def _is_admin(self, request):
        return bool(
            request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )

    def _is_lead(self, request, course):
        return bool(
            request.user.is_authenticated
            and course.lead_id
            and course.lead.user_id == request.user.id
        )

    def _is_staff(self, request, course):
        return bool(
            request.user.is_authenticated
            and CourseStaff.objects.filter(
                course=course,
                student=request.user,
                active=True,
            ).exists()
        )

    def _is_enrolled(self, request, course):
        return bool(
            request.user.is_authenticated
            and CourseEnrollment.objects.filter(
                course=course,
                student__user=request.user,
                active=True,
            ).exists()
        )

    def _get_action(self, view):
        return getattr(view, "action", None)

    def can_view_course_details(self, request, course):
        return (
            self._is_admin(request)
            or self._is_enrolled(request, course)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_view_events(self, request, course):
        return self.can_view_course_details(request, course)

    def can_create_join_code(self, request, course):
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_change_name(self, request, course):
        return self._is_admin(request) or self._is_lead(request, course)

    def can_change_description(self, request, course):
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def can_update_course(self, request, course):
        return (
            self._is_admin(request)
            or self._is_staff(request, course)
            or self._is_lead(request, course)
        )

    def has_permission(self, request, view):
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
        if not request.user.is_authenticated:
            return False

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
