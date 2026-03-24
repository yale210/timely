from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from courses.models import Course, Teacher
from courses.permissions.TeacherPermission import IsTeacher


class TeacherView(ViewSet):
    permission_classes = [IsAuthenticated, IsTeacher]

    def list(self, request):
        teacher = (
            Teacher.objects.select_related("user")
            .filter(
                user=request.user,
                active=True,
            )
            .first()
        )

        if not teacher:
            return Response({"detail": "Teacher profile not found."}, status=404)

        courses = Course.objects.filter(lead=teacher, active=True).order_by(
            "-created_at"
        )

        return Response(
            {

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
