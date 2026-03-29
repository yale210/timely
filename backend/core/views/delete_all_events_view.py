"""Views for bulk deletion of events."""

from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer

from core.models import Event


class DeleteAllEventsView(APIView):
    """View for deleting all events belonging to the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="DeleteAllEventsResponse",
                fields={"message": serializers.CharField()},
            ),
        },
    )
    def delete(self, request):
        """Delete all events for the current user.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A response message indicating the number of events deleted.

        """
        all_events_count = Event.objects.filter(user=request.user).count()

        all_events = Event.objects.filter(user=request.user)

        all_events.delete()

        if all_events_count == 0:
            response = {"message": "You do not have any events to delete"}

        else:
            response = {"message": f"All {all_events_count} events have been deleted"}

        return Response(response)
