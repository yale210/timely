from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class AdminNotificationRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    target = serializers.ChoiceField(choices=["all", "staff", "users"], default="all")
    user_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
    )

    def validate(self, attrs):
        target = attrs.get("target", "all")
        user_ids = attrs.get("user_ids")

        if target == "users" and not user_ids:
            raise serializers.ValidationError(
                {"user_ids": "At least one user ID is required when target is 'users'."}
            )

        return attrs


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
            "last_login",
        ]
