from rest_framework import serializers
from ..models import User


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
