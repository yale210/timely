"""View mixins for course-related events.

Provides endpoints to list existing course events and create new ones,
ensuring that events are correctly associated with courses and their creators.
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.models.course import CourseEvent
from courses.models.teacher import Teacher
from courses.serializers.course_serializer import CourseEventSerializer
from courses.views.base_view import CourseViewSetBase


class CourseEventsMixin(CourseViewSetBase):
    """Mixin providing event-related actions for Course viewsets.

    Handles the logic for retrieving the course event schedule and allowing
    authorized users to add new events.
    """

    @action(detail=True, methods=["get", "post"])
    def events(self, request, pk=None):
        """View and manage course events.

        GET: Returns a chronological list of events for the specified course.
        POST: Creates a new event for the course, assigning the current user as creator.

        Args:
            request: The current HttpRequest object.
            pk: The primary key of the course.

        Returns:
            A Response object with event data or the created event.
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
