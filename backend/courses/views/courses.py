from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from courses.models.course import CourseEnrollment, Course, CourseEvent
from courses.models.student import Student
from courses.models.teacher import Teacher
from courses.permissions.TeacherPermission import IsTeacher
from courses.serializers.course import (
    CourseCreateSerializer,
    CourseSerializer,
    CourseEventSerializer,
)


class CoursePermission(BasePermission):
    def has_permission(self, request, view):
        if view.action == "list":
            return request.user.is_authenticated
        elif view.action == "create":
            return request.user.is_authenticated and IsTeacher().has_permission(
                request, view
            )
        elif view.action in ["retrieve", "update", "partial_update", "destroy"]:
            return True
        else:
            return True

    def has_object_permission(self, request, view, obj):
        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        if view.action == "retrieve":
            return True  # Allow any authenticated user to retrieve a course
        elif view.action in ["update", "partial_update"]:
            return obj.lead.user == request.user or request.user.is_admin
        elif view.action == "destroy":
            return obj.lead.user == request.user or request.user.is_admin
        else:
            return False


class CourseView(ViewSet):
    serializer_class = CourseSerializer

    permission_classes = [
        CoursePermission,
    ]

    def list(self, request):
        resp = None
        student = Student.objects.filter(user=request.user).first()
        if IsTeacher().has_permission(request, self):
            courses = Course.objects.filter(
                lead=Teacher.objects.get(user=request.user)
            ).order_by("-created_at")

            resp = Response(
                {
                    "count": len(courses),
                    "teacher": CourseSerializer(courses, many=True).data,
                }
            )
        if not student and not IsTeacher().has_permission(request, self):
            return Response(
                {"detail": "Courses not found for the current user."},
                status=404,
            )

        enrollments = (
            CourseEnrollment.objects.select_related("course")
            .filter(student=student, active=True)
            .order_by("-enrolled_at")
        )

        courses = [
            {
                "id": enrollment.course.id,
                "name": enrollment.course.name,
                "description": enrollment.course.description,
                "active": enrollment.course.active,
                "enrolled_at": enrollment.enrolled_at,
            }
            for enrollment in enrollments
        ]
        resp.data["student"] = courses
        resp.data["count"] = resp.data["count"] + len(courses)
        return resp

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
        course = Course.objects.get(pk=pk)
        serializer = self.serializer_class(course)
        resp = Response(serializer.data)
        data = CourseEnrollment.objects.filter(course=course, active=True).values_list(
            "student_id", flat=True
        )
        resp.data["cohort"] = data.count()
        resp.data["students"] = data
        return resp

    def update(self, request, pk=None):
        course = Course.objects.get(pk=pk)
        serializer = CourseSerializer(course, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def partial_update(self, request, pk=None):
        course = Course.objects.get(pk=pk)
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def destroy(self, request, pk=None):
        course = Course.objects.get(pk=pk)
        course.active = False
        course.save()
        return Response(CourseSerializer(course).data, status=204)

    @action(detail=True, methods=["get", "post"], url_path="events")
    def events(self, request, pk=None):
        self.serializer_class = CourseEventSerializer
        course = get_object_or_404(Course, pk=pk)
        if request.method == "GET":
            queryset = CourseEvent.objects.filter(course=course).order_by("start_time")
            return Response(self.serializer_class(queryset, many=True).data)
        teacher = Teacher.objects.filter(user=request.user).first()
        if not teacher or course.lead_id != teacher.id:
            return Response(
                {"detail": "Only the course lead can create events."}, status=403
            )
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course, created_by=teacher)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        student = Student.objects.get_or_create(user=request.user)[0]
        if not course.active:
            return Response({"detail": "Course is not active."}, status=400)
        if course.lead_id == student.id:
            return Response({"detail": "You cannot join your own course."}, status=400)
        if not student:
            return Response(
                {"detail": "Student profile not found for the current user."},
                status=404,
            )
        enrollment, created = CourseEnrollment.objects.get_or_create(
            course=course, student=student
        )
        if created:
            enrollment.save()
        return Response(
            {"message": "Course enrollment successful."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], url_path="leave")
    def leave(self, request, pk=None):
        """Allow a student to leave a course"""
        course = get_object_or_404(Course, pk=pk)
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

        # Soft delete by marking as inactive instead of hard delete
        enrollment.active = False
        enrollment.save()

        return Response(
            {"message": "Successfully left the course."}, status=status.HTTP_200_OK
        )
