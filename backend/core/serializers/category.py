from rest_framework import serializers

from core.models import Category


class CategorySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Category
        fields = ["id", "text", "colour", "colour_override", "user"]
        read_only_fields = ["id"]
