"""View for deleting user tasks."""

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Task


class DeleteAllTasksView(APIView):
    """API view for deleting user tasks."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        """Delete the authenticated user's Task objects."""
        all_tasks_count = Task.objects.filter(user=request.user).count()

        all_tasks = Task.objects.filter(user=request.user)

        all_tasks.delete()

        if all_tasks_count == 0:
            response = {"message": "You do not have any tasks to delete"}

        else:
            response = {"message": f"All {all_tasks_count} tasks have been deleted"}

        return Response(response)
