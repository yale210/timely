from rest_framework import serializers
from .models import PomoSession

class PomoSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomoSession
        fields = ["id", "duration_minutes", "completed_at", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        return PomoSession.objects.create(user=user, **validated_data)
