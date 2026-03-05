from rest_framework import serializers

from core.models import Category


class CategorySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Category
        fields = ["id", "text", "user"]
        read_only_fields = ["id"]
