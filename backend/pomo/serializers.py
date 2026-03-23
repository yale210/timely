from rest_framework import serializers
from django.utils import timezone
from .models import PomoSession


class PomoSessionSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.IntegerField(min_value=1, max_value=600)

    class Meta:
        model = PomoSession
        fields = ["id", "duration_minutes", "completed_at", "created_at"]
        read_only_fields = ["id", "completed_at", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["completed_at"] = timezone.now()
        return PomoSession.objects.create(user=user, **validated_data)
