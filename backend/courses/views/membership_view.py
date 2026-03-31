"""View mixins for managing course membership and enrollments.

Provides actions for users to join or leave courses, and for administrators
to generate join codes to facilitate student self-enrollment.
"""

from secrets import token_urlsafe

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


def _inactive_course_response():
    """Return the standard response for attempts against inactive courses.

    Returns:
        Response: A 400 response explaining that the course is inactive.
    """
    return Response({"detail": "Course is not active."}, status=400)


def _missing_student_response():
    """Return the response used when the current user has no student profile.

    Returns:
        Response: A 404 response for missing current-user student records.
    """
    return Response(
        {"detail": "Student profile not found for the current user."},
        status=404,
    )


def _user_student_not_found_response():
    """Return the response used when a target student profile is absent.

    Returns:
        Response: A 404 response for a user lookup that has no student row.
    """
    return Response(
        {"detail": "Student profile not found for this user."},
        status=status.HTTP_404_NOT_FOUND,
    )


def _unenrolled_response():
    """Return the response used when the current user is not enrolled.

    Returns:
        Response: A 404 response indicating the enrollment does not exist.
    """
    return Response(
        {"detail": "You are not enrolled in this course."},
        status=404,
    )


def _target_not_enrolled_response():
    """Return the response used when the target user is not enrolled.

    Returns:
        Response: A 404 response indicating the target enrollment is absent.
    """
    return Response(
        {"detail": "User is not enrolled in this course."},
        status=status.HTTP_404_NOT_FOUND,
    )


def _join_code_created_response(join_code):
    """Return the serialized response for a newly created join code.

    Args:
        join_code: The CourseJoinCode instance that was just created.

    Returns:
        Response: A 201 response containing the join code payload.
    """
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


def _generate_unique_join_code() -> str:
    """Generate a join code that does not collide with an existing record.

    Returns:
        str: A short, URL-safe join code suitable for student enrollment.
    """
    code = token_urlsafe(5)
    while CourseJoinCode.objects.filter(code=code).exists():
        # Retry until the generated code is unique in the database.
        code = token_urlsafe(5)
    return code


def _get_enrollment_or_response(course, student, missing_response):
    """Fetch an enrollment or return the supplied error response.

    Args:
        course: The course whose enrollment should be located.
        student: The student whose enrollment is being resolved.
        missing_response: Prebuilt response returned when no enrollment exists.

    Returns:
        tuple[CourseEnrollment | None, Response | None]: The enrollment and
        ``None`` when found, otherwise ``None`` and the provided response.
    """
    try:
        return CourseEnrollment.objects.get(course=course, student=student), None
    except CourseEnrollment.DoesNotExist:
        return None, missing_response


def _deactivate_enrollment(enrollment):
    """Soft-disable an enrollment while preserving the historical row.

    Args:
        enrollment: The active CourseEnrollment row to deactivate.
    """
    enrollment.active = False
    enrollment.save(update_fields=["active"])


def _get_target_student_for_course(user_id):
    """Resolve a student record for the user being removed from a course.

    Args:
        user_id: The user identifier provided by the admin action payload.

    Returns:
        tuple[Student | None, Response | None]: The matching student and
        ``None`` when found, otherwise ``None`` and a 404 response.
    """
    student = Student.objects.filter(user_id=user_id).first()
    if student is None:
        return None, _user_student_not_found_response()
    return student, None


class CourseMembershipMixin(CourseViewSetBase):
    """Mixin providing membership-related actions for Course viewsets.

    Handles direct enrollment, unenrollment, and enrollment via join codes.
    """

    def _get_student_for_user(self, user):
        """Return the student profile for the authenticated user.

        Args:
            user: The current authenticated user.

        Returns:
            Student: The existing or newly created student profile.
        """
        return Student.objects.get_or_create(user=user)[0]

    def _get_active_join_code(self, code):
        """Return an active join code and its related course, if it exists.

        Args:
            code (str): The enrollment code submitted by the client.

        Returns:
            CourseJoinCode | None: The active join-code record, if present.
        """
        return (
            CourseJoinCode.objects.select_related("course")
            .filter(code=code, active=True)
            .first()
        )

    def _get_or_create_active_enrollment(self, course, student):
        """Create or reactivate a course enrollment for the given student.

        Args:
            course: The course being joined.
            student: The student who should be enrolled.

        Returns:
            tuple[CourseEnrollment, bool]: The enrollment row and whether it was
            created during this call.
        """
        enrollment, created = CourseEnrollment.objects.get_or_create(
            course=course,
            student=student,
            defaults={"active": True},
        )
        if not created and not enrollment.active:
            enrollment.active = True
            enrollment.save(update_fields=["active"])
        return enrollment, created

    def _get_join_by_code_error_response(self, join_code):
        """Validate join-code state before the enrollment is created.

        Args:
            join_code: The active CourseJoinCode record.

        Returns:
            Response | None: A validation error response when the code is no
            longer usable, otherwise ``None``.
        """
        if join_code.expires_at and join_code.expires_at <= timezone.now():
            return Response({"detail": "Join code has expired."}, status=400)

        if not join_code.course.active:
            return Response({"detail": "Course is not active."}, status=400)

        return None

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, pk=None):
        """Allows the current user to enroll in the specified course.

        Creates a CourseEnrollment instance for the user. If the enrollment
        already exists but is inactive, it is reactivated.

        Args:
            request: The current HttpRequest object.
            pk: The primary key of the course to join.

        Returns:
            A Response indicating success or failure if the course is inactive.
        """
        course = self.get_course(pk)
        student = self._get_student_for_user(request.user)

        if not course.active:
            return _inactive_course_response()

        _, created = self._get_or_create_active_enrollment(course, student)
        return Response(
            {"message": "Course enrollment successful.", "created": created},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="leave")
    def leave(self, request, pk=None):
        """Allows the current user to leave (soft-delete enrollment) the course.

        Sets the 'active' flag of the CourseEnrollment instance to False.

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course to leave.

        Returns:
            A Response confirming the user has left the course.
        """
        course = self.get_course(pk)
        student = Student.objects.filter(user=request.user).first()

        if not student:
            return _missing_student_response()

        enrollment, error_response = _get_enrollment_or_response(
            course,
            student,
            _unenrolled_response(),
        )
        if error_response is not None:
            return error_response

        _deactivate_enrollment(enrollment)

        return Response(
            {"message": "Successfully left the course."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="remove-user")
    def remove_user(self, request, pk=None):
        """Removes a user from the course by deactivating their enrollment.

        Expected payload:
            {
                "user_id": 123
            }

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course to leave.

        Returns:
            Response: API response indicating success or failure.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student, error_response = _get_target_student_for_course(user_id)
        if error_response is not None:
            return error_response

        enrollment, error_response = _get_enrollment_or_response(
            course,
            student,
            _target_not_enrolled_response(),
        )
        if error_response is not None:
            return error_response

        _deactivate_enrollment(enrollment)

        return Response(
            {"message": "User removed from course."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="join-by-code")
    def join_by_code(self, request):
        """Enrolls a student into a course using a unique join code.

        Validates the code's existence, activation status, and expiration
        before creating or reactivating an enrollment.

        Args:
            request: The current HttpRequest containing the 'code'.

        Returns:
            A Response indicating enrollment success or providing an error detail.
        """
        serializer = CourseJoinCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"].strip()
        join_code = self._get_active_join_code(code)
        if join_code is None:
            return Response({"detail": "Invalid join code."}, status=404)

        error_response = self._get_join_by_code_error_response(join_code)
        if error_response is not None:
            return error_response

        course = join_code.course
        student = self._get_student_for_user(request.user)
        _, created = self._get_or_create_active_enrollment(course, student)

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
        """Generates a new, unique join code for a specific course.

        Restricted to users with sufficient permissions (leads, admins, staff).

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course.

        Returns:
            A Response containing the details of the newly created join code.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)
        code = _generate_unique_join_code()

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
        return _join_code_created_response(join_code)
