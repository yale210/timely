"""Views for the scheduler application."""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Task


class UnscheduleTasksAPIView(APIView):
    """API view for unscheduling tasks.

    This view handles POST requests to clear scheduling allocations for
    tasks that are not completed or locked.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Handle task unscheduling request.

        Args:
            request: The DRF request object.

        Returns:
            A Response object with the count of unscheduled tasks.
        """
        updated = (
            Task.objects.filter(user=request.user)
            .exclude(allocation=[])
            .filter(completed=False, locked=False)
            .update(allocation=[], total_task_allocations=0)
        )
        return Response(
            {"unscheduled_count": updated},
            status=status.HTTP_200_OK,
        )
