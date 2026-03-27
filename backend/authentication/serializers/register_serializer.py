"""Serializers for user registration."""

from django.db import transaction
from rest_framework import serializers
from profiles.models import Profile

from ..models import User


class RegisterSerializer(serializers.ModelSerializer):
    """Serialize and validate data for user registration."""

    name = serializers.CharField(write_only=True, trim_whitespace=True)

    class Meta:
        """Metadata for the RegisterSerializer."""

        model = User
        fields = ["id", "username", "email", "password", "name"]
        extra_kwargs = {
            "password": {"write_only": True},
            "id": {"read_only": True},
        }

    def validate(self, attrs):
        """Validate registration input.

        Args:
            attrs: Incoming serializer data.

        Returns:
            dict: Validated attributes.

        Raises:
            serializers.ValidationError: If the username already exists.
        """
        username = attrs.get("username").strip().lower()
        name = attrs.get("name", "").strip()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("User with this username already exists.")
        if not name:
            raise serializers.ValidationError({"name": ["This field may not be blank."]})
        attrs["username"] = username
        attrs["name"] = name
        return attrs

    def create(self, validated_data):
        """Create a new user account.

        Args:
            validated_data: Validated registration data.

        Returns:
            User: The created user instance.
        """
        profile_name = validated_data.pop("name")
        with transaction.atomic():
            user = User.objects.create_user(**validated_data)
            Profile.objects.create(user=user, name=profile_name)
        return user
