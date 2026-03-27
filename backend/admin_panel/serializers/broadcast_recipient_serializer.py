"""Serializers for broadcast recipient details."""

from rest_framework import serializers

from notifications.models import BroadcastRecipient


class BroadcastRecipientSerializer(serializers.ModelSerializer):
    """Serialize delivery details for a broadcast recipient."""

    username = serializers.ReadOnlyField(source="recipient.username")
    email = serializers.ReadOnlyField(source="recipient.email")

    class Meta:
        """Metadata for the BroadcastRecipientSerializer."""

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
