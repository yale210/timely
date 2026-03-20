from rest_framework import serializers
from core.models import Task, Category
from .category import CategorySerializer


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
            "colour",
            "estimated_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "locked",
            "allow_split",
            "min_split_minutes",
            "max_split_minutes",
            "parent_task",
            "allocation",
            "total_task_allocations",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        return representation

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.fields["categories"].queryset = Category.objects.filter(
                user=request.user
            )
        else:
            self.fields["categories"].queryset = Category.objects.none()


class CalendarResponseSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "colour",
            "estimated_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "locked",
            "allow_split",
            "min_split_minutes",
            "max_split_minutes",
            "parent_task",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        min_split_minutes = attrs.get(
            "min_split_minutes",
            getattr(self.instance, "min_split_minutes", None),
        )
        max_split_minutes = attrs.get(
            "max_split_minutes",
            getattr(self.instance, "max_split_minutes", None),
        )
        if (
            min_split_minutes is not None
            and max_split_minutes is not None
            and max_split_minutes < min_split_minutes
        ):
            raise serializers.ValidationError(
                {
                    "max_split_minutes": (
                        "Maximum split block minutes must be greater than or equal to minimum split block minutes."
                    )
                }
            )
        return attrs
