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
    def list(self, request):
        """Return courses the user is enrolled in, staffs, or leads."""
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
        teacher = Teacher.objects.filter(user=request.user).first()
        serializer = CourseCreateSerializer(
            data=request.data,
            context={"teacher": teacher},
        )
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(CourseCreateSerializer(course).data, status=201)

    def retrieve(self, request, pk=None):
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
        course = self.get_course(pk)
        self.check_object_permissions(request, course)
        course.active = False
        course.save(update_fields=["active"])
        return Response(CourseSerializer(course).data, status=204)
