from rest_framework import serializers

from core.models import Assessment


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = [
            "id",
            "title",
            "module",
            "assessment_type",
            "due_date",
            "length_of_assessment",
            "weighting_of_assessment",
            "notes",
            "reminder_offset",
            "created_at",
            "updated_at",
            "location",
            "start_time",
            "end_time",
            "linked_event",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
