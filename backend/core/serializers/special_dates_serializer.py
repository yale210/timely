"""Serializer definitions for special date resources."""

from rest_framework import serializers

from core.models import SpecialDates


class SpecialDatesSerializer(serializers.ModelSerializer):
    """Serializer for the SpecialDates model."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        """Expose the special-date fields needed by the calendar planner."""

        model = SpecialDates
        fields = ["id", "date", "text", "user"]
