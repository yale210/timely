"""Course staff view mixins."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.models.course import CourseStaff
from courses.serializers.course_serializer import CourseStaffAddSerializer
from courses.views.base_view import CourseViewSetBase

User = get_user_model()


class CourseStaffMixin(CourseViewSetBase):
    """Mixin for course staff actions."""

    @action(detail=True, methods=["get", "post", "delete"], url_path="staff")
    def staff(self, request, pk=None):
        """List, add, or remove course staff members.

        Args:
            request: The incoming DRF request.
            pk: The primary key of the course whose staff is being managed.

        Returns:
            Response: A response containing the staff payload or operation result.
        """
        course = self.get_course(pk)
        self.check_object_permissions(request, course)

        if request.method == "GET":
            staff = (
                CourseStaff.objects.select_related("student")
                .filter(course=course, active=True)
                .order_by("-assigned_at")
            )
            return Response(
                [
                    {
                        "id": item.id,
                        "user_id": item.student_id,
                        "username": item.student.username,
                        "active": item.active,
                        "assigned_at": item.assigned_at,
                    }
                    for item in staff
                ]
            )

        if request.method == "POST":
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

