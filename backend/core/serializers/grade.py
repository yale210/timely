from rest_framework import serializers

from core.models import Grade


class GradeSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    time_spent_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id",
            "user",
            "name",
            "category",
            "category_name",
            "score",
            "total_possible",
            "percentage",
            "date_achieved",
            "time_spent_minutes",
        ]
        read_only_fields = ["user", "percentage", "time_spent_minutes"]

    def get_category_name(self, obj):
        return obj.category.text if obj.category else None

    def get_time_spent_minutes(self, obj):
        return obj.get_time_spent_minutes()
