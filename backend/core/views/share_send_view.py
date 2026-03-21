from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import PendingShareEvent
from core.models import Event
from django.contrib.auth import get_user_model


class ShareSendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Who the event is being shared with
        username = request.data.get("Receiver")
        event_id = request.data.get("Event-ID")

        # Cannot be left empty
        if not (username and event_id):
            response = {"error": "Please provide a username and event ID"}
            return Response(response)

        # Events begin with an e visually to the user, but in the DB they are just an int
        # e.g. e123 -> 123
        event_id_in_db = event_id[1:]

        # This is a security measure to ensure that a user can't share an event they don't own
        event_belongs_to_sharer = Event.objects.filter(
            user=request.user,
            pk=event_id_in_db,
        ).exists()

        if not event_belongs_to_sharer:
            response = {"error": "Please provide a valid event ID"}
            return Response(response)

        # If the user owns the event, its details are stored
        event_to_share = Event.objects.get(pk=event_id_in_db)
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
            response = {"error": "Please provide a valid username"}
            return Response(response)

        # This checks to make sure that the user doesn't already have the same event (duplicates not allowed)
        event_belongs_to_receiver = Event.objects.filter(
            user=receiver_user,
            title=event_summary,
            start_time=event_start,
            end_time=event_end,
        ).exists()

        # Techincally the event is not "sent", but this approach ensures privacy for the recipient as telling the sender
        # that the event was sent ensures that no information about the receiver's calenar is leaked

        # e.g. A malicious user could try sending different events to someone to see what they already have in their calendar
        # this would be a privacy violation.
        if event_belongs_to_receiver:
            response = {"message": "Event sent 0"}
            return Response(response)

        request_already_exists = PendingShareEvent.objects.filter(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        ).exists()

        # Only 1 request per person, per event
        # This ensures that the GUI is kept clean
        if request_already_exists:
            response = {
                "error": "You may not send more than 1 of the same event to the same person"
            }
            return Response(response)

        # Just because the event was shared successfully doesn't mean that the receiver will want to accept it
        # The receiver will have a chance to accept or reject it
        PendingShareEvent.objects.create(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        )

        response = {"message": "Event sent 1"}
        return Response(response)
