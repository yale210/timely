"""Serializers for broadcast recipient details."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from notifications.models import BroadcastRecipient

User = get_user_model()


class BroadcastRecipientSerializer(serializers.ModelSerializer):
    """Serialize delivery details for a broadcast recipient."""

    username = serializers.ReadOnlyField(source="recipient.username")
    email = serializers.ReadOnlyField(source="recipient.email")

    class Meta:
        model = BroadcastRecipient
        fields = [
            "id",
            "recipient",
            "username",
            "email",
            "status",
            "error_code",
            "error_message",
            "last_attempt_at",
            "notification",
        ]
