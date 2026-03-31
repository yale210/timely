"""Serializers for broadcast job detail responses."""

from rest_framework import serializers

from notifications.models import BroadcastJob


class BroadcastJobDetailSerializer(serializers.ModelSerializer):
    """Serialize detailed broadcast job data."""

    sender_username = serializers.ReadOnlyField(source="sender.username")

    class Meta:
        """Metadata for the BroadcastJobDetailSerializer."""

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
        ]
