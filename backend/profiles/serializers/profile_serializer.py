from django.utils import timezone
from rest_framework import serializers

from profiles.models.profile import Profile


class ProfileSerializer(serializers.ModelSerializer):
    def validate_date_of_birth(self, value):
        if value is not None and value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    class Meta:
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
        read_only_fields = ["creation_date"]


class PublicProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    joined_at = serializers.DateTimeField(source="user.date_joined", read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ["username", "name", "bio", "avatar_url", "joined_at"]

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url
