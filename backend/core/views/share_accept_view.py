from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Event
from core.models import PendingShareEvent


class ShareAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
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

            # The share request is deleted
            pending_event.delete()
            response = {"message": "This event has been accepted"}
            return Response(response)

        else:
            # The share request is deleted
            pending_event.delete()
            response = {"message": "This event has been rejected"}
            return Response(response)
