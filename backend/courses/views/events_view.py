"""View mixins for course-related events.

Provides endpoints to list existing course events and create new ones,
ensuring that events are correctly associated with courses and their creators.
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.models.course import CourseEvent, CourseEnrollment
from courses.models.teacher import Teacher
from courses.serializers.course_serializer import CourseEventSerializer
from courses.views.base_view import CourseViewSetBase
from notifications.models import Notification


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

    def post_notification(self, request, course_id):
        """Handles the creation of notifications for course events.

        Creates a notification for each enrolled student in the specified course.

        Args:
            request: The current HttpRequest object containing notification data.
            course_id: The primary key of the course.

        Returns:
            A Response object with created notification data and 201 status.
        """
        course = self.get_course(course_id)
        self.check_object_permissions(request, course)

        # Get all active enrollments for the course
        enrollments = CourseEnrollment.objects.filter(
            course=course, active=True
        ).select_related("student__user")

        # Extract notification content from request
        title = request.data.get("title", "")
        message = request.data.get("message", "")

        # Create notifications for each enrolled student
        notifications = []
        for enrollment in enrollments:
            notification = Notification.objects.create(
                user=enrollment.student.user,
                title=title,
                message=message,
                course=course
            )
            notifications.append(notification)

        # Serialize and return created notifications
        notification_data = [
            {
                "id": notif.id,
                "user_id": notif.user.id,
                "title": notif.title,
                "message": notif.message,
                "course_id": notif.course.id
            }
            for notif in notifications
        ]

        return Response(notification_data, status=status.HTTP_201_CREATED)
