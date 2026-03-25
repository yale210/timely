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
    permission_classes = [IsAuthenticated, IsTeacher]

    def list(self, request):
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

    @action(detail=False, methods=["post"], url_path="", permission_classes=[IsAuthenticated])
    def create_teacher(self, request):
        serializer = TeacherCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(id=serializer.validated_data["user_id"])
        print(serializer.validated_data["user_id"], request.user.id, request.user.is_superuser)
        if serializer.validated_data["user_id"] != request.user.id and not request.user.is_superuser:
            return Response({"detail": "You are not authorized to create a teacher."}, status=status.HTTP_403_FORBIDDEN)
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
