from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models import Friendship


User = get_user_model()


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for the Friendship model."""
    receiver = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False
    )
    receiver_username = serializers.CharField(write_only=True, required=False)
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    receiver_username_display = serializers.CharField(
        source="receiver.username", read_only=True
    )
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    receiver_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = [
            "id",
            "sender",
            "receiver",
            "receiver_username",
            "sender_username",
            "receiver_username_display",
            "sender_name",
            "receiver_name",
            "sender_avatar",
            "receiver_avatar",
            "state",
            "updated_at",
        ]
        read_only_fields = ["sender", "state", "updated_at"]

    def validate(self, attrs):
        """Validate the friendship data before saving.

        Returns:
            dict: The validated attributes for the Friendship instance.
            
        Raises:
            ValidationError: If the data is invalid.
        """
        receiver = attrs.get("receiver")
        receiver_username = attrs.pop("receiver_username", None)
        if receiver and receiver_username:
            raise serializers.ValidationError(
                {
                    "receiver_username": "Provide either receiver id or username, not both."
                }
            )
        if receiver_username:
            try:
                receiver = User.objects.get(username=receiver_username)
            except User.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"receiver_username": "User with this username does not exist."}
                ) from exc
            attrs["receiver"] = receiver
        if not attrs.get("receiver"):
            raise serializers.ValidationError(
                {"receiver_username": "Username is required."}
            )
        return attrs

    def _get_profile(self, user):
        return getattr(user, "user_profile", None)

    def _get_profile_name(self, user):
        profile = self._get_profile(user)
        if profile and profile.name:
            return profile.name
        return user.username

    def _get_avatar_url(self, user):
        profile = self._get_profile(user)
        if not profile or not getattr(profile, "avatar", None):
            return None
        request = self.context.get("request")
        url = profile.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_sender_name(self, obj):
        """Get the profile name of the sender.

        Returns:
            str: The sender's profile name or username if no profile name.
        """
        return self._get_profile_name(obj.sender)

    def get_receiver_name(self, obj):
        """Get the display name of the receiver.
        
        Returns:
            str: The receiver's name, or their username.
        """
        return self._get_profile_name(obj.receiver)

    def get_sender_avatar(self, obj):
        """Get the avatar URL of the sender.

        Returns:
            str | None: The URL of the sender's avatar or None.
        """
        return self._get_avatar_url(obj.sender)

    def get_receiver_avatar(self, obj):
        """Get the avatar URL of the receiver.

        Returns:
            str | None: The URL of the receiver's avatar or None.
        """
        return self._get_avatar_url(obj.receiver)
