"""Views for managing user friendships and requests."""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Friendship
from core.serializers import FriendshipSerializer


class FriendshipViewSet(viewsets.ModelViewSet):
    """Manage friendship requests for the authenticated user.
    Users can send, accept, and decline friend requests.
    """

    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve friendships where the user is either the sender or receiver.

        Returns:
            QuerySet: A filtered queryset of Friendship objects.

        """
        user = self.request.user
        return Friendship.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        """Create a new friend request using the authenticated user as the sender.

        Args:
            serializer (BaseSerializer): The serializer instance containing validated data.

        Raises:
            ValidationError: If the friendship request logic fails.

        """
        receiver = serializer.validated_data["receiver"]

        try:
            friendship = Friendship.send_request(
                sender=self.request.user, receiver=receiver
            )
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message) from exc

        serializer.instance = friendship

    @action(detail=True, methods=["post"], url_path="accept")
    def accept_request(self, request, pk=None):
        """Accept a friend request if the authenticated user is the receiver.

        Args:
            request (Request): The DRF request object.
            pk (int | None): The primary key of the friendship object.

        Returns:
            Response: A DRF response indicating success or forbidden status.

        """
        friend_request = self.get_object()
        # Validate user is the one request was sent to.
        if friend_request.receiver != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        friend_request.accept_friend_request()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="decline")
    def decline_request(self, request, pk=None):
        """Decline a friend request if the authenticated user is the receiver.

        Args:
            request (Request): The DRF request object.
            pk (int | None): The primary key of the friendship object.

        Returns:
            Response: A DRF response indicating success or forbidden status.

        """
        friend_request = self.get_object()
        # Validate user is the one request was sent to.
        if friend_request.receiver != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        friend_request.decline_friend_request()
        return Response(status=status.HTTP_204_NO_CONTENT)
