"""Serializers for private and public profile data."""

from django.utils import timezone
from rest_framework import serializers

from drf_spectacular.utils import extend_schema_field

from profiles.models.profile import Profile


class ProfileSerializer(serializers.ModelSerializer):
    """Serialize editable profile data for the authenticated user."""

    def validate_date_of_birth(self, value):
        """Reject dates of birth that are in the future.

        Args:
            value: The submitted date of birth value.

        Returns:
            date | None: The validated date value.

        Raises:
            serializers.ValidationError: If the date is in the future.
        """
        if value is not None and value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    class Meta:
        """Metadata for the profile serializer."""

        model = Profile
        fields = [
            "name",
            "date_of_birth",
            "creation_date",
            "slogan",
            "bio",
            "avatar",
            "xp",
            "level",
        ]
        read_only_fields = ["creation_date", "xp", "level"]


class PublicProfileSerializer(serializers.ModelSerializer):
    """Serialize the public-facing subset of profile fields."""

    username = serializers.CharField(source="user.username", read_only=True)
    joined_at = serializers.DateTimeField(source="user.date_joined", read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the profile serializer."""

        model = Profile
        fields = ["username", "name", "bio", "avatar_url", "joined_at"]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_avatar_url(self, obj):
        """Build an absolute avatar URL when request context is available.

        Args:
            obj: The profile instance being serialized.

        Returns:
            str | None: The absolute or relative avatar URL, or ``None``.
        """
        if not obj.avatar:
            return None
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url
