"""Serializers for teacher-related data structures.

This module provides serializers for promoting users to teachers and for
representing teacher profiles in the API.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models.teacher import Teacher

User = get_user_model()


class TeacherCreateSerializer(serializers.Serializer):
    """Serializer for promoting a system user to a teacher role."""

    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        """Ensures the specified user ID corresponds to an existing system user.

        Args:
            value: The integer ID of the user.

        Returns:
            The validated user ID.

        Raises:
            serializers.ValidationError: If no user matches the provided ID.
        """
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for representing a Teacher profile.

    Includes user metadata alongside the teacher's active status, flattening
    the relationship with the underlying User model for the API.
    """

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        """Meta options for TeacherSerializer."""

        model = Teacher
        fields = ("user_id", "username", "first_name", "last_name", "active")
