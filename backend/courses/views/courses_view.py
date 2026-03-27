"""Course CRUD view mixins."""

from django.db.models import Q
from rest_framework.generics import get_object_or_404

from rest_framework.response import Response

from courses.models.course import Course, CourseEnrollment
from courses.models.student import Student
from courses.models.teacher import Teacher
from courses.permissions.course_permission import CoursePermission
from courses.serializers.course_serializer import (
    CourseCreateSerializer,
    CourseSerializer,
)
from courses.views.base_view import CourseViewSetBase


class CourseCrudMixin(CourseViewSetBase):
    """Mixin for course CRUD actions."""

    def list(self, request):
        """Return courses relevant to the authenticated user.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: A response containing the visible course list.
        """
        student = Student.objects.filter(user=request.user).first()
        teacher = Teacher.objects.filter(user=request.user).first()

        if request.user.is_superuser:
            courses = Course.objects.all().order_by("-created_at")
            return Response(CourseSerializer(courses, many=True).data, status=200)

        if not student and not teacher:
            return Response([], status=200)

        courses = (
            Course.objects.filter(
                Q(enrollments__student=student, enrollments__active=True)
                | Q(staff_members__student=request.user, staff_members__active=True)
                | Q(lead=teacher)
            )
            .distinct()
            .order_by("-created_at")
        )

        return Response(CourseSerializer(courses, many=True).data, status=200)

    def create(self, request):
        """Create a new course for the authenticated teacher.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: A response containing the created course payload.
        """
        teacher = Teacher.objects.filter(user=request.user).first()
        serializer = CourseCreateSerializer(
            data=request.data,
            context={"teacher": teacher},
        )
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(CourseCreateSerializer(course).data, status=201)

    def retrieve(self, request, pk=None):
        """Return a course with its active student cohort.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to retrieve.

        Returns:
            Response: A response containing the course detail payload.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        serializer = self.serializer_class(course)
        resp = Response(serializer.data)

        enrollments = CourseEnrollment.objects.filter(
            course=course, active=True
        ).select_related("student__user")

        students_data = [
            {
                "id": enrollment.student.user.id,
                "username": enrollment.student.user.username,
            }
            for enrollment in enrollments
        ]

        resp.data["cohort"] = len(students_data)
        resp.data["students"] = students_data
        return resp

    def update(self, request, pk=None):
        """Replace the course fields the user is allowed to modify.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to update.

        Returns:
            Response: A response containing the updated course payload.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        perm = CoursePermission()
        data = request.data.copy()

        if not perm.can_change_name(request, course):
            data.pop("name", None)
        if not perm.can_change_description(request, course):
            data.pop("description", None)

        serializer = CourseSerializer(course, data=data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """Partially update the course fields the user may change.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to update.

        Returns:
            Response: A response containing the updated course payload.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        perm = CoursePermission()
        data = request.data.copy()

        if "name" in data and not perm.can_change_name(request, course):
            data.pop("name", None)
        if "description" in data and not perm.can_change_description(request, course):
            data.pop("description", None)

        serializer = CourseSerializer(course, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """Soft-delete a course by deactivating it.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to deactivate.

        Returns:
            Response: A response containing the deactivated course payload.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)
        course.active = False
        course.save(update_fields=["active"])
        return Response(CourseSerializer(course).data, status=204)
