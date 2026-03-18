"""Serializers for broadcast job detail responses."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

<<<<<<< HEAD
from admin_panel.serializers.broadcast_recipient_serializer import (
    BroadcastRecipientSerializer,
)
=======
from admin_panel.serializers.broadcast_recipient_serializer import BroadcastRecipientSerializer
>>>>>>> ff0fb21 (chore: seperate serializers.py into different files)
from notifications.models import BroadcastJob

User = get_user_model()


class BroadcastJobDetailSerializer(serializers.ModelSerializer):
    """Serialize detailed broadcast job data with nested recipients."""

    sender_username = serializers.ReadOnlyField(source="sender.username")
    recipients = BroadcastRecipientSerializer(many=True, read_only=True)

    class Meta:
        model = BroadcastJob
        fields = [
            "id",
            "title",
            "message",
            "target",
            "status",
            "task_id",
            "recipient_count",
            "delivered_count",
            "failed_count",
            "sender",
            "sender_username",
            "audience_filters",
            "audience_snapshot",
            "provider_errors",
            "queued_at",
            "started_at",
            "completed_at",
            "retry_of",
            "recipients",
        ]
