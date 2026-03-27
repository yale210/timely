"""Authentication serializers."""

from django.contrib.auth import authenticate
from rest_framework import serializers



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
        username = attrs.get("username").strip().lower()
        password = attrs.get("password")

        if not username:
            raise serializers.ValidationError("Username is required.")

        if not password:
            raise serializers.ValidationError("Password is required.")

        user = authenticate(
            request=self.context.get("request"), username=username, password=password
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs
