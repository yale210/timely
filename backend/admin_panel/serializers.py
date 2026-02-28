from django.contrib.auth import get_user_model
from rest_framework import serializers

from notifications.models import BroadcastJob, BroadcastRecipient

User = get_user_model()


class AdminNotificationRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=60)
    message = serializers.CharField(max_length=240)
    target = serializers.ChoiceField(
        choices=["all", "staff", "admin", "users"],
        default="all",
    )
    user_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
    )

    def validate(self, attrs):
        attrs["title"] = attrs.get("title", "").strip()
        attrs["message"] = attrs.get("message", "").strip()
        target = attrs.get("target", "all")
        user_ids = attrs.get("user_ids")

        if not attrs["title"] or not attrs["message"]:
            raise serializers.ValidationError(
                {"detail": "Title and message are required."}
            )

        if target == "users" and not user_ids:
            raise serializers.ValidationError(
                {"user_ids": "At least one user ID is required when target is 'users'."}
            )

        if target != "users":
            attrs["user_ids"] = []

        if user_ids:
            attrs["user_ids"] = sorted(set(user_ids))

        return attrs


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
            "last_login",
        ]


class BroadcastRecipientSerializer(serializers.ModelSerializer):
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


class BroadcastJobListSerializer(serializers.ModelSerializer):
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


class BroadcastJobDetailSerializer(serializers.ModelSerializer):
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
