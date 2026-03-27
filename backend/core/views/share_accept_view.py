"""View for accepting or rejecting shared event requests."""

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Event, PendingShareEvent


class ShareAcceptView(APIView):
    """View to accept or reject a shared event request.

    This view handles the POST request to either create a new event for the
    recipient (if accepted) or simply dismiss the share request (if rejected).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Handle accepting or rejecting a shared event.

        Args:
            request (Request): The DRF request object containing:
                - Decision (str): Either "accept" or "reject".
                - Event-ID (int): The ID of the pending share event.

        Returns:
            Response: A DRF response with a success message or an error message.

        """
        # "accept" or "reject"
        decision = request.data.get("Decision")
        event_id = request.data.get("Event-ID")

        if not decision and event_id:
            response = {"error": "Please provide a decision and event ID"}
            return Response(response)

        # The event must exist for it to be accepted
        try:
            pending_event = PendingShareEvent.objects.get(event=event_id)
        except PendingShareEvent.DoesNotExist:
            response = {"error": "Event does not exist, likely deleted"}
            return Response(response)

        # A user must be the intended recipient of the event
        if pending_event.receiver != request.user:
            response = {"error": "This event is not shared with you"}
            return Response(response)

        # Accepting creates a new event object for the user
        if decision == "accept":
            Event.objects.create(
                user=request.user,
                title=pending_event.event.title,
                description=pending_event.event.description,
                start_time=pending_event.event.start_time,
                end_time=pending_event.event.end_time,
                location=pending_event.event.location,
                recurrence_interval=pending_event.event.recurrence_interval,
                recurrence_end=pending_event.event.recurrence_end,
                exception_dates=pending_event.event.exception_dates,
            )

            # The share request is deleted as accepted
            pending_event.delete()
            response = {"message": "This event has been accepted"}
            return Response(response)

        else:
            # The share request is deleted as rejected
            pending_event.delete()
            response = {"message": "This event has been rejected"}
            return Response(response)
