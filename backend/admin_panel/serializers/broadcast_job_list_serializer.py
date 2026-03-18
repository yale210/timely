"""Serializers for broadcast job list responses."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from notifications.models import BroadcastJob

User = get_user_model()


class BroadcastJobListSerializer(serializers.ModelSerializer):
    """Serialize summary data for broadcast job listings."""

    sender_username = serializers.ReadOnlyField(source="sender.username")

    class Meta:
        model = BroadcastJob
        fields = [
            "id",
            "title",
            "target",
            "status",
            "recipient_count",
            "delivered_count",
            "failed_count",
            "sender",
            "sender_username",
            "queued_at",
            "completed_at",
        ]
