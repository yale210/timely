"""View mixins for managing course staff and teaching assistants.

Provides administrative actions to list, add, and remove staff members
from specific course instances.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.models.course import CourseStaff
from courses.serializers.course_serializer import CourseStaffAddSerializer
from courses.views.base_view import CourseViewSetBase

User = get_user_model()


class CourseStaffMixin(CourseViewSetBase):
    """Mixin providing staff-related actions for Course viewsets.

    Handles the management of teaching assistants and other staff members
    assigned to a course.
    """

    def _serialise_staff_member(self, staff_member):
        """Convert a CourseStaff row into the API response payload.

        Args:
            staff_member: The active staff assignment to serialise.

        Returns:
            dict[str, object]: The response-ready representation of the staff
            member and assignment metadata.
        """
        return {
            "id": staff_member.id,
            "user_id": staff_member.student_id,
            "username": staff_member.student.username,
            "active": staff_member.active,
            "assigned_at": staff_member.assigned_at,
        }

    def _list_staff(self, course):
        """Return all active staff assignments for a course.

        Args:
            course: The course whose staff roster is being listed.

        Returns:
            Response: A list response containing the serialised staff members.
        """
        staff = (
            CourseStaff.objects.select_related("student")
            .filter(course=course, active=True)
            .order_by("-assigned_at")
        )
        # Prefetching the student relation avoids one query per staff member when
        # building the response list.
        return Response(
            [self._serialise_staff_member(staff_member) for staff_member in staff]
        )

    def _add_staff_member(self, request, course):
        """Add or reactivate a staff assignment for the supplied user.

        Args:
            request: The DRF request containing a validated ``user_id``.
            course: The course receiving the staff assignment.

        Returns:
            Response: A success payload with the assignment ID and creation
            state.
        """
        serializer = CourseStaffAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(id=serializer.validated_data["user_id"])
        staff_member, created = CourseStaff.objects.get_or_create(
            course=course,
            student=user,
            defaults={"active": True},
        )
        if not created and not staff_member.active:
            staff_member.active = True
            staff_member.save(update_fields=["active"])

        return Response(
            {
                "message": "Staff member added successfully.",
                "staff_id": staff_member.id,
                "created": created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def _remove_staff_member(self, request, course):
        """Remove a staff assignment from the course roster.

        Args:
            request: The DRF request containing the target ``user_id``.
            course: The course whose staff assignment should be removed.

        Returns:
            Response: A no-content response when the staff member is removed,
            or a 404/400 response when validation fails.
        """
        staff_user_id = request.data.get("user_id")
        if not staff_user_id:
            return Response({"detail": "user_id is required."}, status=400)

        deleted, _ = CourseStaff.objects.filter(
            course=course,
            student_id=staff_user_id,
        ).delete()
        if not deleted:
            return Response({"detail": "Staff member not found."}, status=404)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get", "post", "delete"], url_path="staff")
    def staff(self, request, pk=None):
        """Manages the staff members associated with a specific course.

        Supports listing active staff (GET), adding a new staff member (POST),
        and removing a staff member (DELETE).

        Args:
            request: The current HttpRequest.
            pk: The primary key of the course.

        Returns:
            A Response containing the staff list, success message, or no content.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)

        if request.method == "GET":
            return self._list_staff(course)

        if request.method == "POST":
            return self._add_staff_member(request, course)

        return self._remove_staff_member(request, course)
