"""View for sending shared events."""

from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import PendingShareEvent
from core.models import Event
from django.contrib.auth import get_user_model


class ShareSendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Handle part of the sharing of an event between users.
        Specifically sending an event share request to another user.
        """

        # Who the event is being shared with and what event ID it is
        username = request.data.get("Receiver")
        event_id = request.data.get("Event-ID")

        # Cannot be left empty
        if not (username and event_id and str(event_id).strip()):
            response = {"error": "Please provide a username and event ID"}
            return Response(response, status=400)

        # Checks that events are in the correct format and then converts them e.g. e123 -> 123
        try:
            event_id_string = str(event_id).strip()
            if event_id_string.startswith("e"):
                event_id_in_db = int(event_id_string[1:])
            else:
                event_id_in_db = int(event_id_string)
        except (ValueError, TypeError):
            response = {"error": "Please provide a valid username and event ID"}
            return Response(response, status=400)

        # Just because an event exists, it doesn't mean that the user can share it
        event_belongs_to_sharer = Event.objects.filter(
            user=request.user,
            pk=event_id_in_db,
        ).exists()

        if not event_belongs_to_sharer:
            response = {"detail": "Please provide an event ID that you own"}
            return Response(response, status=400)

        # If the user owns the event, its details are stored
        try:
            event_to_share = Event.objects.get(pk=event_id_in_db)
        except Event.DoesNotExist:
            response = {"detail": "Please provide an event ID that you own"}
            return Response(response, status=400)

        event_summary = event_to_share.title
        event_start = event_to_share.start_time
        event_end = event_to_share.end_time

        User = get_user_model()

        # The person receiving the event must exist
        try:
            receiver_user = User.objects.get(username=username)
            receiver_exists = True
        except User.DoesNotExist:
            receiver_exists = False

        if not receiver_exists:
            response = {"detail": "Please provide a username that exists"}
            return Response(response, status=400)

        # This checks to make sure that the user doesn't already have the same event (duplicates not allowed)
        event_belongs_to_receiver = Event.objects.filter(
            user=receiver_user,
            title=event_summary,
            start_time=event_start,
            end_time=event_end,
        ).exists()

        # This is a special case: the user sends an event that the other person already has, but the user will not be told
        # that the event failed to save as this would reveal the receivers events in their calendar - privacy violation
        if event_belongs_to_receiver:
            response = {"detail": "Event sent 0"}
            return Response(response)

        request_already_exists = PendingShareEvent.objects.filter(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        ).exists()

        # Only 1 request per person, per event
        # This ensures that the GUI is kept clean, and event share requests can't be spam sent
        if request_already_exists:
            response = {
                "detail": "You may not send more than 1 of the same event to the same person"
            }
            return Response(response, status=400)

        # After the event is sent, the receiver can choose to accept or reject it -> share_accept_view.py
        PendingShareEvent.objects.create(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        )

        response = {"detail": "Event sent 1"}
        return Response(response)
