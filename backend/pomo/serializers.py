"""Serialisers for the pomo application."""

from rest_framework import serializers
from django.utils import timezone
from .models import PomoSession


class PomoSessionSerializer(serializers.ModelSerializer):

    """Serialiser for the PomoSession model.
    
    This class handles the conversion of PomoSession instances to and from
    JSON formats, including validation of the duration.
    
    Attributes:
        duration_minutes (IntegerField): Duration field with defined constraints.
    """
    duration_minutes = serializers.IntegerField(min_value=1, max_value=600)

    class Meta:

        """Metadata configurations for the serialiser."""
        model = PomoSession
        fields = ["id", "duration_minutes", "completed_at", "created_at"]
        read_only_fields = ["id", "completed_at", "created_at"]

    def create(self, validated_data):
        """Create and return a new session instance.
        
        This method automatically assigns the authenticated user and
        sets the completion timestamp to the current time.
        
        Args:
            validated_data (dict): The validated data parsed from the request.
            
        Returns:
            PomoSession: The newly created database instance.
        """
        user = self.context["request"].user
        validated_data["completed_at"] = timezone.now()
        return PomoSession.objects.create(user=user, **validated_data)
