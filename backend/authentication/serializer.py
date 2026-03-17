from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


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


class LoginSerializer(serializers.Serializer):
    """Serialize and validate user login credentials."""
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(
        style={"input_type": "password"}, trim_whitespace=False
    )

    def validate(self, attrs):
        """Validate login credentials.

        Args:
            attrs: Incoming login data.

        Returns:
            dict: Validated attributes including the authenticated user.

        Raises:
            serializers.ValidationError: If required fields are missing or
                credentials are invalid.
        """
        username = attrs.get("username")
        password = attrs.get("password")

        if not username:
            raise serializers.ValidationError("Username is required.")

        if not password:
            raise serializers.ValidationError("Password is required.")

        if not User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Invalid credentials.")

        user = authenticate(
            request=self.context.get("request"), username=username, password=password
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Serialize user data for API responses."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "last_login",
            "date_of_birth",
            "date_joined",
            "is_staff",
            "is_superuser",
        ]
