from rest_framework import serializers

from core.models import Assessment


class AssessmentSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Assessment
        fields = [
            "id",
            "user",
            "title",
            "module",
            "assessment_type",
            "due_date",
            "length_of_assessment",
            "weighting_of_assessment",
            "notes",
            "reminder_offset",
            "linked_event",
            "created_at",
            "updated_at",

            


        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "user",
            "linked_event",
        ]
