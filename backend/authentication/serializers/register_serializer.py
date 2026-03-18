from rest_framework import serializers

from ..models import User


class RegisterSerializer(serializers.ModelSerializer):
    """Serialize and validate data for user registration."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
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
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("User with this username already exist.")
        return attrs

    def create(self, validated_data):
        """Create a new user account.

        Args:
            validated_data: Validated registration data.

        Returns:
            User: The created user instance.
        """
        user = User.objects.create_user(**validated_data)
        return user
