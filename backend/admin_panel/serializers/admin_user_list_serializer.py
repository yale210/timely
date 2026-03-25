"""Serializers for admin-facing user listings."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class AdminUserListSerializer(serializers.ModelSerializer):
    """Serialize user data for the admin panel user list."""

    class Meta:
        """Metadata for the AdminUserListSerializer."""

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
