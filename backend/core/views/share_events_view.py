"""View to retrieve shared event requests."""

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import PendingShareEvent
from django.db.models import Q


class ShareEventsView(APIView):
    """View to list pending shared event requests.

    This view handles the GET request to retrieve all pending share event
    requests where the current user is either the sender or the receiver.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retrieve list of shared events involving the user.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A list of shared event metadata including sender,
                receiver, and event details.

        """
        shared_events = PendingShareEvent.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )

        # Only the data about the event to display will be sent as the rest is purposeless for the GUI
        response = [
            {
                "id": s.id,
                "sender": s.sender.id,
                "receiver": s.receiver.id,
                "sender_username": s.sender.username,
                "receiver_username": s.receiver.username,
                "event_id": s.event.id,
                "event_title": s.event.title,
            }
            for s in shared_events
        ]

        return Response(response)
