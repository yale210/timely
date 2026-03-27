"""Course event view mixins."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.models.course import CourseEvent
from courses.models.teacher import Teacher
from courses.serializers.course_serializer import CourseEventSerializer
from courses.views.base_view import CourseViewSetBase


class CourseEventsMixin(CourseViewSetBase):
    """Mixin for course event actions."""

    @action(detail=True, methods=["get", "post"])
    def events(self, request, pk=None):
        """List or create events for a course.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course whose events are being handled.

        Returns:
            Response: A response containing event data or the created event.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)

        if request.method == "GET":
            queryset = CourseEvent.objects.filter(course=course).order_by("start_time")
            return Response(CourseEventSerializer(queryset, many=True).data)

        teacher = Teacher.objects.filter(user=request.user).first()
        serializer = CourseEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(course=course, created_by=teacher)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

