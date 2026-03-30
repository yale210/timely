"""Views for bulk deletion of tasks."""

from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer
from django.db import transaction
from core.models import Task


class DeleteAllTasksView(APIView):
    """View for deleting all tasks belonging to the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="DeleteAllTasksResponse",
                fields={"message": serializers.CharField()},
            ),
        },
    )
    def delete(self, request):
        """Delete all tasks for the current authenticated user.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A response message indicating the number of tasks deleted.

        """
        all_tasks_count = Task.objects.filter(user=request.user).count()

        all_tasks = Task.objects.filter(user=request.user)

        with transaction.atomic():
            all_tasks.delete()

        if all_tasks_count == 0:
            response = {"message": "You do not have any tasks to delete"}

        else:
            response = {"message": f"All {all_tasks_count} tasks have been deleted"}

        return Response(response)
