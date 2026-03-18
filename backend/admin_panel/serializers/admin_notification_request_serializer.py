"""Serializers for admin notification request payloads."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class AdminNotificationRequestSerializer(serializers.Serializer):
    """Validate admin notification request data."""

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
        """Normalize and validate notification request data.

        Args:
            attrs: Incoming serializer attributes.

        Returns:
            dict: Validated and normalized attributes.

        Raises:
            serializers.ValidationError: If the request data is invalid.
        """
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

        if user_ids:
            attrs["user_ids"] = sorted(set(user_ids))

        if target != "users":
            attrs["user_ids"] = []

        return attrs
