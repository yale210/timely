from django.contrib.auth import get_user_model
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ViewSet

from courses.models.course import Course
from courses.permissions.course import CoursePermission
from courses.serializers.course import CourseSerializer

User = get_user_model()


class CourseViewSetBase(ViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, CoursePermission]

    def get_course(self, pk):
        return get_object_or_404(Course, pk=pk)