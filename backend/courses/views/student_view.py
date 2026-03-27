"""Course student view mixins."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from courses.models import CourseEnrollment, Course
from courses.views import CourseViewSetBase


class CourseStudentMixin(CourseViewSetBase):
    """Mixin for course student actions."""

    @action(detail=True, methods=["get"], url_path="students")
    def students(self, request, pk=None):
        """Return active students for the requested course.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course whose students are being listed.

        Returns:
            Response: A response containing the active student payload.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        enrollments = (
            CourseEnrollment.objects.select_related("student", "student__user")
            .filter(course=course, active=True)
            .order_by("-enrolled_at")
        )

        return Response(
            [
                {
                    "id": enrollment.student_id,
                    "user_id": enrollment.student.user_id,
                    "username": enrollment.student.user.username,
                    "email": enrollment.student.user.email,
                    "enrolled_at": enrollment.enrolled_at,
                }
                for enrollment in enrollments
            ],
            status=status.HTTP_200_OK,
        )
