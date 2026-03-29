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
        try:
            normalized_username, event_id = self.get_username_and_event_id(request)

            event_id_in_db = self.get_event_id_in_database(event_id)

            event_to_share = self.get_event_to_share(request, event_id_in_db)

            receiver_user = self.get_receiver_user(normalized_username)

            event_belongs_to_receiver = self.check_event_belongs_to_receiver(
                event_to_share, receiver_user
            )

            if event_belongs_to_receiver:
                response = {"message": "Event sent 0"}
                return Response(response)

            self.check_share_request_already_exists(
                request, event_to_share, receiver_user
            )

            PendingShareEvent.objects.create(
                sender=request.user,
                receiver=receiver_user,
                event=event_to_share,
            )

            response = {"message": "Event sent 1"}
            return Response(response)

        except ValueError as e:
            response = {"message": str(e)}
            return Response(response, status=400)

    def get_username_and_event_id(self, request):
        username = request.data.get("Receiver")
        event_id = request.data.get("Event-ID")
        normalized_username = str(username).strip().lower() if username else ""

        if not (normalized_username and event_id and str(event_id).strip()):
            raise ValueError("Please provide a username and event ID")

        return normalized_username, event_id

    def get_event_id_in_database(self, event_id):
        try:
            event_id_string = str(event_id).strip()
            if event_id_string.startswith("e"):
                event_id_in_db = int(event_id_string[1:])
            else:
                event_id_in_db = int(event_id_string)
        except (ValueError, TypeError):
            raise ValueError("Please provide a valid event ID")

        return event_id_in_db

    def get_event_to_share(self, request, event_id_in_db):
        try:
            event_to_share = Event.objects.get(user=request.user, pk=event_id_in_db)
        except Event.DoesNotExist:
            raise ValueError("Please provide an event ID that you own")
        return event_to_share

    def get_receiver_user(self, normalized_username):
        try:
            receiver_user = get_user_model().objects.get(username=normalized_username)
        except get_user_model().DoesNotExist:
            raise ValueError("Please provide a username that exists")
        return receiver_user

    def check_event_belongs_to_receiver(self, event_to_share, receiver_user):
        event_belongs_to_receiver = Event.objects.filter(
            user=receiver_user,
            title=event_to_share.title,
            start_time=event_to_share.start_time,
            end_time=event_to_share.end_time,
        ).exists()

        if event_belongs_to_receiver:
            return True
        else:
            return False

    def check_share_request_already_exists(
        self, request, event_to_share, receiver_user
    ):
        request_already_exists = PendingShareEvent.objects.filter(
            sender=request.user,
            receiver=receiver_user,
            event=event_to_share,
        ).exists()

        if request_already_exists:
            raise ValueError(
                "You may not send more than 1 of the same event to the same person"
            )
        else:
            return False
