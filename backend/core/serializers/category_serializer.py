"""Serializer definitions for category resources."""

from rest_framework import serializers

from core.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for the Category model."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Category
        fields = [
            "id",
            "text",
            "colour",
            "colour_override",
            "max_daily_study_time",
            "user",
        ]
        read_only_fields = ["id"]
