from rest_framework import serializers
from core.models import Task, Category
from .category_serializer import CategorySerializer


class CalendarSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "estimated_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "parent_task",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        return representation
