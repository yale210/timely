<<<<<<< HEAD:backend/courses/views/membership.py
from secrets import token_urlsafe
=======
"""Course membership view mixins."""
>>>>>>> origin/main:backend/courses/views/membership_view.py

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.models.course import CourseEnrollment, CourseJoinCode
from courses.models.student import Student
from courses.serializers.course_serializer import (
    CourseJoinCodeCreateSerializer,
    CourseJoinCodeSerializer,
)
from courses.views.base_view import CourseViewSetBase


class CourseMembershipMixin(CourseViewSetBase):
    """Mixin for course membership actions."""

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, pk=None):
        """Enroll the current user in the requested course.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to join.

        Returns:
            Response: A response describing the enrollment result.
        """
        course = self.get_course(pk)
        student = Student.objects.get_or_create(user=request.user)[0]

        if not course.active:
            return Response({"detail": "Course is not active."}, status=400)

        enrollment, created = CourseEnrollment.objects.get_or_create(
            course=course,
            student=student,
            defaults={"active": True},
        )
        if not created and not enrollment.active:
            enrollment.active = True
            enrollment.save(update_fields=["active"])
        enrollment.active = True
        return Response(
            {"message": "Course enrollment successful.", "created": created},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="leave")
    def leave(self, request, pk=None):
        """Leave the requested course.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to leave.

        Returns:
            Response: A response describing the leave result.
        """
        course = self.get_course(pk)
        student = Student.objects.filter(user=request.user).first()

        if not student:
            return Response(
                {"detail": "Student profile not found for the current user."},
                status=404,
            )

        try:
            enrollment = CourseEnrollment.objects.get(course=course, student=student)
        except CourseEnrollment.DoesNotExist:
            return Response(
                {"detail": "You are not enrolled in this course."}, status=404
            )

        enrollment.active = False
        enrollment.save(update_fields=["active"])

        return Response(
            {"message": "Successfully left the course."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="join-by-code")
    def join_by_code(self, request):
        """Join a course using a join code.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: A response describing the enrollment result.
        """
        serializer = CourseJoinCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"].strip()
        join_code = (
            CourseJoinCode.objects.select_related("course")
            .filter(code=code, active=True)
            .first()
        )

        if not join_code:
            return Response({"detail": "Invalid join code."}, status=404)

        if join_code.expires_at and join_code.expires_at <= timezone.now():
            return Response({"detail": "Join code has expired."}, status=400)

        course = join_code.course
        if not course.active:
            return Response({"detail": "Course is not active."}, status=400)

        student = Student.objects.filter(user=request.user).first()
        if not student:
            student = Student.objects.create(user=request.user)

        enrollment, created = CourseEnrollment.objects.get_or_create(
            course=course,
            student=student,
            defaults={"active": True},
        )

        if not created and not enrollment.active:
            enrollment.active = True
            enrollment.save(update_fields=["active"])

        return Response(
            {
                "message": "Course enrollment successful.",
                "course_id": course.id,
                "created": created,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="join-code")
    def join_code(self, request, pk=None):
        """Create a join code for the requested course.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to generate a join code for.

        Returns:
            Response: A response containing the created join code payload.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)

        code = token_urlsafe(5)
        while CourseJoinCode.objects.filter(code=code).exists():
            code = token_urlsafe(5)

        serializer = CourseJoinCodeCreateSerializer(
            data={
                "code": code,
                "expires_at": request.data.get("expires_at"),
                "active": True,
            },
            context={"course": course},
        )
        serializer.is_valid(raise_exception=True)
        join_code = serializer.save()

        return Response(
            {
                "id": join_code.id,
                "code": join_code.code,
                "expires_at": join_code.expires_at,
                "active": join_code.active,
                "created_at": join_code.created_at,
            },
            status=status.HTTP_201_CREATED,
        )
