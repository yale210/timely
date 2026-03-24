from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from secrets import token_urlsafe

from knox.auth import TokenAuthentication
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from courses.models.course import CourseEnrollment, Course, CourseEvent, CourseJoinCode, CourseStaff
from courses.models.student import Student
from courses.models.teacher import Teacher
from courses.permissions.course import CoursePermission
from courses.permissions.TeacherPermission import IsTeacher
from courses.serializers.course import (
    CourseCreateSerializer,
    CourseDescriptionSerializer,
    CourseEventSerializer,
    CourseJoinCodeSerializer,
    CourseNameSerializer,
    CourseSerializer,
    CourseStaffAddSerializer,
)

from django.db.models import Q

User = get_user_model()


class CourseView(ViewSet):
    serializer_class = CourseSerializer

    permission_classes = [IsAuthenticated, CoursePermission]

    def list(self, request):
        """Return courses the user is enrolled in, staffs, or leads."""
        student = Student.objects.filter(user=request.user).first()
        teacher = Teacher.objects.filter(user=request.user).first()

        if request.user.is_superuser:
            courses = Course.objects.all().order_by("-created_at")
            return Response(
                CourseSerializer(courses, many=True).data,
                status=200,
            )

        if not student and not teacher:
            return Response(
                {"detail": "Courses not found for the current user."},
                status=404,
            )

        courses = Course.objects.filter(
            Q(enrollments__student=student, enrollments__active=True)
            | Q(staff_members__student=request.user, staff_members__active=True)
            | Q(lead=teacher)
        ).distinct().order_by("-created_at")

        return Response(
            CourseSerializer(courses, many=True).data,
            status=200,
        )

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
        data = CourseEnrollment.objects.filter(course=course, active=True).values_list(
            "student_id", flat=True
        )
        resp.data["cohort"] = data.count()
        resp.data["students"] = data
        return resp

    def update(self, request, pk=None):
        course = Course.objects.get(pk=pk)
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
        course = Course.objects.get(pk=pk)
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
        course = Course.objects.get(pk=pk)
        self.check_object_permissions(request, course)
        course.active = False
        course.save(update_fields=["active"])
        return Response(CourseSerializer(course).data, status=204)

    @action(detail=True, methods=["get", "post"], url_path="events")
    def events(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        if request.method == "GET":
            queryset = CourseEvent.objects.filter(course=course).order_by("start_time")
            return Response(CourseEventSerializer(queryset, many=True).data)

        teacher = Teacher.objects.filter(user=request.user).first()
        serializer = CourseEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course, created_by=teacher)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="join-code")
    def join_code(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        code = token_urlsafe(5)
        while CourseJoinCode.objects.filter(code=code).exists():
            code = token_urlsafe(5)

        serializer = CourseJoinCodeSerializer(
            data={
                "code": code,
                "expires_at": request.data.get("expires_at"),
                "active": True,
            }
        )
        serializer.is_valid(raise_exception=True)
        join_code = serializer.save(course=course)

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

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
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

        return Response(
            {"message": "Course enrollment successful.", "created": created},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="join-by-code")
    def join_by_code(self, request):
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

    @action(detail=True, methods=["post"], url_path="leave")
    def leave(self, request, pk=None):
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

        enrollment.active = False
        enrollment.save(update_fields=["active"])

        return Response(
            {"message": "Successfully left the course."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get", "post", "delete"], url_path="staff")
    def staff(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        self.check_object_permissions(request, course)

        if request.method == "GET":
            staff = (
                CourseStaff.objects.select_related("student")
                .filter(course=course, active=True)
                .order_by("-assigned_at")
            )
            return Response(
                [
                    {
                        "id": item.id,
                        "user_id": item.student_id,
                        "username": item.student.username,
                        "active": item.active,
                        "assigned_at": item.assigned_at,
                    }
                    for item in staff
                ]
            )

        if request.method == "POST":
            serializer = CourseStaffAddSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            user = User.objects.get(id=serializer.validated_data["user_id"])
            staff_member, created = CourseStaff.objects.get_or_create(
                course=course,
                student=user,
                defaults={"active": True},
            )
            if not created and not staff_member.active:
                staff_member.active = True
                staff_member.save(update_fields=["active"])

            return Response(
                {
                    "message": "Staff member added successfully.",
                    "staff_id": staff_member.id,
                    "created": created,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        staff_user_id = request.data.get("user_id")
        if not staff_user_id:
            return Response({"detail": "user_id is required."}, status=400)

        deleted, _ = CourseStaff.objects.filter(
            course=course,
            student_id=staff_user_id,
        ).delete()

        if not deleted:
            return Response({"detail": "Staff member not found."}, status=404)

        return Response(status=status.HTTP_204_NO_CONTENT)