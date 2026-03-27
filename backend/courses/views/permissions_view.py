"""Course permission view mixins."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.serializers.permission_serializer import (
    PermissionsSerializer as CoursePermissionsSerializer,
)
from courses.views.base_view import CourseViewSetBase


class CoursePermissionsMixin(CourseViewSetBase):
    """Mixin for course permission actions."""

    @action(detail=True, methods=["get"], url_path="permissions")
    def permissions(self, request, pk=None):
        """Return permission flags for the requested course.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course to evaluate.

        Returns:
            Response: A response containing the computed permission flags.
        """
        course = self.get_course(pk)
        serializer = CoursePermissionsSerializer(
            course,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
