"""View for sending event share requests to other users."""

from django.contrib.auth import get_user_model
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Event, PendingShareEvent


class ShareSendView(APIView):
    """View to initiate sharing an event with another user.

    This view handles the POST request to create a pending share event request.
    It performs security checks to ensure the sender owns the event and that
    the receiver exists and does not already have a duplicate event.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Send an event share request to another user.

        Args:
            request (Request): The DRF request object containing:
                - Receiver (str): The username of the recipient.
                - Event-ID (str|int): The ID of the event to share.

        Returns:
            Response: A DRF response indicating if the event was sent or
                an error message if validation fails.

        """
        username = request.data.get("Receiver")
        event_id = request.data.get("Event-ID")
        normalized_username = str(username).strip().lower() if username else ""

        if not (normalized_username and event_id and str(event_id).strip()):
            response = {"message": "Please provide a username and event ID"}
            return Response(response, status=400)

        try:
            event_id_string = str(event_id).strip()
            if event_id_string.startswith("e"):
                event_id_in_db = int(event_id_string[1:])
            else:
                event_id_in_db = int(event_id_string)
        except (ValueError, TypeError):
            response = {"message": "Please provide a valid username and event ID"}
            return Response(response, status=400)

        event_belongs_to_sharer = Event.objects.filter(
            user=request.user,
            pk=event_id_in_db,
        ).exists()

        if not event_belongs_to_sharer:
            response = {"message": "Please provide an event ID that you own"}
            return Response(response, status=400)

        try:
            event_to_share = Event.objects.get(pk=event_id_in_db)
        except Event.DoesNotExist:
            response = {"message": "Please provide an event ID that you own"}
            return Response(response, status=400)

        event_summary = event_to_share.title
        event_start = event_to_share.start_time
        event_end = event_to_share.end_time

        User = get_user_model()

        try:
            receiver_user = User.objects.get(username=normalized_username)
            receiver_exists = True
        except User.DoesNotExist:
            receiver_exists = False

        if not receiver_exists:
            response = {"message": "Please provide a username that exists"}
            return Response(response, status=400)

        event_belongs_to_receiver = Event.objects.filter(
            user=receiver_user,
            title=event_summary,
            start_time=event_start,
            end_time=event_end,
        ).exists()

        if event_belongs_to_receiver:
            response = {"message": "Event sent 0"}
            return Response(response)

        request_already_exists = PendingShareEvent.objects.filter(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        ).exists()

        if request_already_exists:
            response = {
                "message": "You may not send more than 1 of the same event to the same person"
            }
            return Response(response, status=400)

        PendingShareEvent.objects.create(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        )

        response = {"message": "Event sent 1"}
        return Response(response)
