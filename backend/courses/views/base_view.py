"""Base view classes for the courses application.

This module provides common functionality and shared configurations for
the various ViewSets that handle course operations, ensuring consistent
permission and serialization defaults.
"""

from django.contrib.auth import get_user_model
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ViewSet

from courses.models.course import Course
from courses.permissions.course_permission import CoursePermission
from courses.serializers.course_serializer import CourseSerializer

User = get_user_model()


class CourseViewSetBase(ViewSet):
    """Base class for all Course-related viewsets.

    Standardizes the serialization and permission classes used across the
    course management API.
    """

    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, CoursePermission]
    queryset = Course.objects.none()  # Enables path parameter type inference

    def get_course(self, pk):
        """Retrieves a Course instance by primary key or raises 404.

        Args:
            pk: The primary key of the course to retrieve.

        Returns:
            The Course model instance.
        """
        return get_object_or_404(Course, pk=pk)
