"""View mixins for managing course-level permissions.

Provides specialized actions to retrieve and manage authorization states
for specific course instances.
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.serializers.permission_serializer import (
    PermissionsSerializer as CoursePermissionsSerializer,
)
from courses.views.base_view import CourseViewSetBase


class CoursePermissionsMixin(CourseViewSetBase):
    """Mixin providing permission-related actions for Course viewsets.

    Handles retrieval of calculated permissions for the current user
    relative to a specific course.
    """

    @action(detail=True, methods=["get"], url_path="permissions")
    def permissions(self, request, pk=None):
        """Retrieves the calculated permission set for the specified course.

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course.

        Returns:
            A Response containing serialized permission data.
        """
        course = self.get_course(pk)
        serializer = CoursePermissionsSerializer(
            course,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
