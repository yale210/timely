"""Base view classes for course resources."""

from django.contrib.auth import get_user_model
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ViewSet

from courses.models.course import Course
from courses.permissions.course_permission import CoursePermission
from courses.serializers.course_serializer import CourseSerializer

User = get_user_model()


class CourseViewSetBase(ViewSet):
    """Base view set for course resources."""

    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, CoursePermission]

    def get_course(self, pk):
        """Return the requested course instance.

        Args:
            pk: The primary key of the course to fetch.

        Returns:
            Course: The matching course instance.
        """
        return get_object_or_404(Course, pk=pk)
