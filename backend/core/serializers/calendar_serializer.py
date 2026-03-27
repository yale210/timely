"""Serializers and validation helpers for calendar task data."""

from rest_framework import serializers

from core.models import Category, Task

from ..calendar_validation import CalendarValidationMixin
from .category_serializer import CategorySerializer


class CalendarSerializer(CalendarValidationMixin, serializers.ModelSerializer):
    """Serializer for the calendar ."""

    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    remaining_minutes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "colour",
            "estimated_minutes",
            "completed_minutes",
            "remaining_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "locked",
            "allow_split",
            "min_split_minutes",
            "max_split_minutes",
            "buffer_before_minutes",
            "buffer_after_minutes",
            "parent_task",
            "allocation",
            "total_task_allocations",
        ]
        read_only_fields = ["total_task_allocations"]

    def to_representation(self, instance):
        """Convert the Task instance into dictionary.

        Args:
            instance (Task): The Task instance to be converted to a dictionary.

        Returns:
            dict: The representation of the Task instance.
        """
        representation = super().to_representation(instance)
        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        return representation

    def get_remaining_minutes(self, instance):
        """Calculate the remaining minutes for a task.

        Args:
            instance (Task): The task instance.

        Returns:
            int: The remaining minutes after calculation.
        """
        return max(0, instance.estimated_minutes - instance.completed_minutes)

    def __init__(self, *args, **kwargs):
        """Enable filtering of categories based on the user.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.fields["categories"].queryset = Category.objects.filter(
                user=request.user
            )
        else:
            self.fields["categories"].queryset = Category.objects.none()

    def create(self, validated_data):
        """Create a task instance.

        Args:
            validated_data (dict): The validated data for the task to be created.

        Returns:
            Task: The created task instance.
        """
        if validated_data.get("completed"):
            validated_data["allocation"] = []
        allocation = validated_data.get("allocation") or []
        validated_data["total_task_allocations"] = len(allocation)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update a Task instance with the provided data.

        Args:
            instance (Task): The Task instance to be updated.
            validated_data (dict): The validated data to enable updating the Task.

        Returns:
            Task: The updated Task instance.
        """
        if validated_data.get("completed"):
            validated_data["allocation"] = []
        allocation = validated_data.get("allocation", instance.allocation or [])
        validated_data["total_task_allocations"] = len(allocation)
        return super().update(instance, validated_data)


class CalendarResponseSerializer(serializers.ModelSerializer):
    """Serializer for the Calendar Responses."""

    categories = CategorySerializer(many=True, read_only=True)
    remaining_minutes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "colour",
            "estimated_minutes",
            "completed_minutes",
            "remaining_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "locked",
            "allow_split",
            "min_split_minutes",
            "max_split_minutes",
            "buffer_before_minutes",
            "buffer_after_minutes",
            "parent_task",
        ]

    def get_remaining_minutes(self, instance):
        """Calculate the remaining minutes for a task by subtracting the completed minutes and estimated minutes.

        Returns:
            int: The number of remaining minutes for the task.
        """
        return max(0, instance.estimated_minutes - instance.completed_minutes)

    def validate(self, attrs):
        """Validate the calendar's data.

        Args:
            attrs (dict): The data which is to be validated.

        Returns:
            dict: The validated data for the calendar.

        Raises:
            ValidationError: If the data is invalid.
        """
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
