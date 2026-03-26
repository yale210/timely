"""Views for managing teacher profiles and their associated courses.

Provides endpoints for listing active teachers, registering new teacher profiles,
and unregistering (deactivating) teacher accounts.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from courses.models import Course, Teacher
from courses.permissions.TeacherPermission import IsTeacher
from courses.serializers.teacher import TeacherCreateSerializer, TeacherSerializer

User = get_user_model()


class TeacherView(ViewSet):
    """ViewSet for handling teacher-related operations.

    Manages teacher registration, deactivation, and retrieval of teacher
    profiles including their associated course leads.
    """

    permission_classes = [IsAuthenticated, IsTeacher]

    def list(self, request):
        """Lists all active teachers and their managed courses.

        Args:
            request: The current HttpRequest.

        Returns:
            A Response containing a list of teacher profiles and their courses.
        """
        teachers = (
            Teacher.objects.select_related("user")
            .filter(active=True)
            .order_by("user__username")
        )

        data = []
        for teacher in teachers:
            courses = Course.objects.filter(lead=teacher, active=True).order_by(
                "-created_at"
            )
            data.append(
                {
                    "id": teacher.user_id,
                    "user_id": teacher.user_id,
                    "username": teacher.user.username,
                    "active": teacher.active,
                    "courses": [
                        {
                            "id": course.id,
                            "name": course.name,
                            "description": course.description,
                            "created_at": course.created_at,
                            "active": course.active,
                        }
                        for course in courses
                    ],
                }
            )

        return Response(data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        url_path="",
        permission_classes=[IsAuthenticated],
    )
    def create_teacher(self, request):
        """Registers a new teacher profile for the current or specified user.

        Args:
            request: The current HttpRequest containing 'user_id'.

        Returns:
            A Response containing the serialized teacher profile.
        """
        serializer = TeacherCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(id=serializer.validated_data["user_id"])
        if (
            serializer.validated_data["user_id"] != request.user.id
            and not request.user.is_superuser
        ):
            return Response(
                {"detail": "You are not authorized to create a teacher."},
                status=status.HTTP_403_FORBIDDEN,
            )
        teacher, created = Teacher.objects.get_or_create(
            user=user,
            defaults={"active": True},
        )

        if not created and not teacher.active:
            teacher.active = True
            teacher.save(update_fields=["active"])

        return Response(
            TeacherSerializer(teacher).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="unregister_teacher",
        permission_classes=[IsAuthenticated],
    )
    def unregister_teacher(self, request):
        """Deactivates the teacher profile for the current user.

        Args:
            request: The current HttpRequest.

        Returns:
            A Response containing the updated teacher profile state.
        """
        teacher = Teacher.objects.filter(user=request.user).first()

        if teacher is None:
            return Response(
                {"detail": "You are not registered as a teacher."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not teacher.active:
            return Response(
                TeacherSerializer(teacher).data,
                status=status.HTTP_200_OK,
            )

        teacher.active = False
        teacher.save(update_fields=["active"])

        return Response(TeacherSerializer(teacher).data, status=status.HTTP_200_OK)
