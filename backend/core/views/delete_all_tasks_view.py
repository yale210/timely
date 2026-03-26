"""Views for bulk deletion of tasks."""

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Task


class DeleteAllTasksView(APIView):
    """View for deleting all tasks belonging to the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        """Delete all tasks for the current user.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A response message indicating the number of tasks deleted.

        """
        all_tasks_count = Task.objects.filter(user=request.user).count()

        all_tasks = Task.objects.filter(user=request.user)

        all_tasks.delete()

        if all_tasks_count == 0:
            response = {"message": "You do not have any tasks to delete"}

        else:
            response = {"message": f"All {all_tasks_count} tasks have been deleted"}

        return Response(response)
