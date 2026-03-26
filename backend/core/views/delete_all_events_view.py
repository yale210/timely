"""View for deleting user events."""

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Event


class DeleteAllEventsView(APIView):
    """API view for deleting user events."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        """Delete the authenticated user's Event objects."""
        all_events_count = Event.objects.filter(user=request.user).count()

        all_events = Event.objects.filter(user=request.user)

        all_events.delete()

        if all_events_count == 0:
            response = {"message": "You do not have any events to delete"}

        else:
            response = {"message": f"All {all_events_count} events have been deleted"}

        return Response(response)
