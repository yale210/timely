"""Serializer definitions for grade resources."""

from typing import Any

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from core.models import Grade


class GradeSerializer(serializers.ModelSerializer):
    """Serializer for the Grade model."""

    category_name = serializers.SerializerMethodField()
    category_colour = serializers.SerializerMethodField()
    percentage = serializers.FloatField(read_only=True)
    time_spent_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id",
            "user",
            "name",
            "category",
            "category_name",
            "category_colour",
            "score",
            "total_possible",
            "percentage",
            "date_achieved",
            "time_spent_minutes",
        ]
        read_only_fields = ["user", "percentage", "time_spent_minutes"]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_category_name(self, obj: Any) -> str | None:
        """Get the name of the category associated with the grade.

        Returns:
            str | None: The name of the category or None.
        """
        return obj.category.text if obj.category else None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_category_colour(self, obj: Any) -> str | None:
        """Get the colour associated with the grade's category.

        Returns:
            str | None: The colour of the category or None.

        """
        return obj.category.colour if obj.category else None

    @extend_schema_field(serializers.IntegerField(min_value=0))
    def get_time_spent_minutes(self, obj: Any) -> int:
        """Calculate total estimated minutes spent on tasks.

        Returns:
            int: The total minutes spent on tasks linked to the specific grade's assessment.
        """
        return obj.get_time_spent_minutes()

    def create(self, validated_data):
        """Override the create method to set the user from the context of the request.

        Returns:
            Grade: The created Grade instance.
        """
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
