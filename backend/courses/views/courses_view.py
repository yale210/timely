"""View mixins for Course CRUD operations.

Provides the implementation for listing, creating, retrieving, updating,
and soft-deleting Course instances, integrating with custom permission checks
and specialized serializers.
"""

from django.db.models import Q
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from courses.models.course import Course, CourseEnrollment
from courses.models.student import Student
from courses.models.teacher import Teacher
from courses.permissions.course import CoursePermission
from courses.serializers.course import CourseCreateSerializer, CourseSerializer
from courses.views.base import CourseViewSetBase


class CourseCrudMixin(CourseViewSetBase):
    """Mixin providing standard CRUD actions for Course objects.

    Implements list, create, retrieve, update, partial_update, and destroy
    actions with specific business logic for course visibility and lead assignment.
    """

    def list(self, request):
        """Returns a list of courses the user is involved in.

        Filters courses by enrollment status, staff assignment, or lead status.
        Superusers receive all courses in the system.

        Args:
            request: The current HttpRequest object.

        Returns:
            A Response object containing a list of Course objects.
        """
        student = Student.objects.filter(user=request.user).first()
        teacher = Teacher.objects.filter(user=request.user).first()

        if request.user.is_superuser:
            courses = Course.objects.all().order_by("-created_at")
            return Response(CourseSerializer(courses, many=True).data, status=200)

        if not student and not teacher:
            return Response(
                {"detail": "Courses not found for the current user."},
                status=404,
            )

        # Retrieve courses where user is student, staff, or lead teacher
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
        """Creates a new course and assigns the requesting user as the lead teacher.

        Args:
            request: The current HttpRequest containing course data.

        Returns:
            A Response object containing the created Course data.
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
        """Retrieves detailed information about a single course.

        Includes cohort size and a list of enrolled student usernames in the
        response data.

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course to retrieve.

        Returns:
            A Response object containing detailed Course data including enrollment info.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        serializer = self.serializer_class(course)
        resp = Response(serializer.data)

        # Fetch active enrollments to build student list and cohort count
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
        """Updates an existing course, respecting granular field-level permissions.

        Args:
            request: The current HttpRequest containing updated data.
            pk: The primary key of the course to update.

        Returns:
            A Response object containing the updated Course data.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        perm = CoursePermission()
        data = request.data.copy()

        # Enforce field-level restrictions based on user roles
        if not perm.can_change_name(request, course):
            data.pop("name", None)
        if not perm.can_change_description(request, course):
            data.pop("description", None)

        serializer = CourseSerializer(course, data=data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """Partially updates a course, respecting granular field-level permissions.

        Args:
            request: The current HttpRequest containing partial update data.
            pk: The primary key of the course.

        Returns:
            A Response object containing the updated Course data.
        """
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        perm = CoursePermission()
        data = request.data.copy()

        # Prevent unauthorized updates to specific fields
        if "name" in data and not perm.can_change_name(request, course):
            data.pop("name", None)
        if "description" in data and not perm.can_change_description(request, course):
            data.pop("description", None)

        serializer = CourseSerializer(course, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """Performs a soft-delete by deactivating the course.

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course to deactivate.

        Returns:
            A Response object containing the deactivated Course data with a 204 status.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)
        course.active = False
        course.save(update_fields=["active"])
        return Response(CourseSerializer(course).data, status=204)
