"""View for retrieving all the pending share event objects for a user."""

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import PendingShareEvent
from django.db.models import Q


class ShareEventsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Handle POST requests for sending a share request to another user.

        Creates a pending share event object.
        """
        # All share requests that the user sent or received
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
