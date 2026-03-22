from typing import Any

from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from core.models import Grade


class GradeSerializer(serializers.ModelSerializer):
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
        return obj.category.text if obj.category else None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_category_colour(self, obj: Any) -> str | None:
        return obj.category.colour if obj.category else None

    @extend_schema_field(serializers.IntegerField(min_value=0))
    def get_time_spent_minutes(self, obj: Any) -> int:
        return obj.get_time_spent_minutes()

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
