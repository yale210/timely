from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError
from core.models import Friendship
from core.serializers import FriendshipSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError


class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        receiver = serializer.validated_data["receiver"]

        try:
            friendship = Friendship.send_request(
                sender=self.request.user, receiver=receiver
            )
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message) from exc

        serializer.instance = friendship

    # Specific object, only post allowed
    @action(detail=True, methods=["post"], url_path="accept")
    def accept_request(self, request, pk=None):
        friend_request = self.get_object()
        # Validate user is the one request was sent to.
        if friend_request.receiver != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        else:
            friend_request.accept_friend_request()
            return Response(status=status.HTTP_204_NO_CONTENT)

    # Specific object, only post allowed
    @action(detail=True, methods=["post"], url_path="decline")
    def decline_request(self, request, pk=None):
        friend_request = self.get_object()
        # Validate user is the one request was sent to.
        if friend_request.receiver != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        else:
            friend_request.decline_friend_request()
            return Response(status=status.HTTP_204_NO_CONTENT)
