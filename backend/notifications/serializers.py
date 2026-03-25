"""Serializers for the notifications app."""

from rest_framework import serializers

from notifications.models import Notification, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model."""

    sender_username = serializers.ReadOnlyField(source="sender.username")

    class Meta:
        """Meta options for NotificationSerializer."""

        model = Notification
        fields = [
            "id",
            "recipient",
            "sender",
            "sender_username",
            "title",
            "message",
            "is_read",
            "timestamp",
            "notification_type",
        ]
        read_only_fields = ["id", "recipient", "sender", "timestamp"]


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for the PushSubscription model."""

    class Meta:
        """Meta options for PushSubscriptionSerializer."""

        model = PushSubscription
        fields = ["id", "endpoint", "p256dh", "auth", "created_at"]
        read_only_fields = ["id", "created_at"]
