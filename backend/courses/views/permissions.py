from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from courses.models.course import Course
from courses.serializers.permission import PermissionsSerializer as CoursePermissionsSerializer
from courses.views.base import CourseViewSetBase


class CoursePermissionsMixin(CourseViewSetBase):
    @action(detail=True, methods=["get"], url_path="permissions")
    def permissions(self, request, pk=None):
        course = self.get_course(pk)
        serializer = CoursePermissionsSerializer(
            course,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
    