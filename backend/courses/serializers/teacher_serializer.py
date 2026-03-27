"""Serializer definitions for teacher resources."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models.teacher import Teacher

User = get_user_model()


class TeacherCreateSerializer(serializers.Serializer):
    """Serializer for creating teacher records."""

    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        """Validate that the provided user exists.

        Args:
            value: The submitted user identifier.

        Returns:
            int: The validated user identifier.

        Raises:
            ValidationError: If the user does not exist.
        """
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for teacher responses."""

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = Teacher
        fields = ("user_id", "username", "first_name", "last_name", "active")
