from rest_framework import serializers

from core.models import Friendship


class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ["id", "sender", "receiver", "state", "updated_at"]
        read_only_fields = ["state", "updated_at"]
