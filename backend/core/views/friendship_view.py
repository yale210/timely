from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from core.models import Friendship
from core.serializers import FriendshipSerializer


class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        receiver = serializer.validated_data["receiver"]

        friendship = Friendship.send_request(
            sender=self.request.user, receiver=receiver
        )

        serializer.instance = friendship


    # TODO: ADD CUSTOM ACTIONS FRO ACCEPT / DECLINE