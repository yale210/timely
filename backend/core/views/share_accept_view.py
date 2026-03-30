"""View for accepting or rejecting shared event requests."""

from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer

from core.models import Event, PendingShareEvent


class ShareAcceptView(APIView):
    """View to accept or reject a shared event request.

    This view handles the POST request to either create a new event for the
    recipient (if accepted) or simply dismiss the share request (if rejected).
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=inline_serializer(
            name="ShareAcceptRequest",
            fields={
                "Decision": serializers.CharField(
                    help_text='Either "accept" or "reject".',
                ),
                "Event-ID": serializers.IntegerField(
                    help_text="ID of the pending share event.",
                ),
            },
        ),
        responses={
            200: inline_serializer(
                name="ShareAcceptSuccessResponse",
                fields={"message": serializers.CharField()},
            ),
            400: inline_serializer(
                name="ShareAcceptErrorResponse",
                fields={"error": serializers.CharField()},
            ),
        },
    )
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

        if not (decision and event_id):
            response = {"error": "Please provide a decision and event ID"}
            return Response(response, status=400)

        # The event must exist for it to be accepted
        try:
            pending_event = PendingShareEvent.objects.get(event=event_id)
        except PendingShareEvent.DoesNotExist:
            response = {"error": "Event does not exist, likely deleted"}
            return Response(response, status=400)

        # A user must be the intended recipient of the event
        if pending_event.receiver != request.user:
            response = {"error": "This event is not shared with you"}
            return Response(response, status=400)

        # Accepting creates a new event object for the user
        if decision == "accept":
            self.create_object_from_shared_event(request, pending_event)
            pending_event.delete()

            response = {"message": "This event has been accepted"}

        elif decision == "reject":
            pending_event.delete()
            response = {"message": "This event has been rejected"}

        else:
            response = {"error": "Invalid decision"}
            return Response(response, status=400)

        return Response(response)

    def create_object_from_shared_event(self, request, pending_event):
        """Clone a pending shared event into the recipient's calendar.

        Args:
            request: The DRF request for the authenticated recipient.
            pending_event (PendingShareEvent): The share request being
                accepted, including the source event to duplicate.

        """
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
