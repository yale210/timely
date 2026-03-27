"""Serializer for scheduling requests."""

from rest_framework import serializers


class ScheduleRequestSerializer(serializers.Serializer):
    """Serializer for scheduling requests.

    This serializer validates the parameters for the scheduling process,
    such as the start date, maximum days ahead, and split allowance.
    """

    start_date = serializers.DateField(required=False)
    max_days_ahead = serializers.IntegerField(min_value=1, max_value=30, required=False)
    allow_split = serializers.BooleanField(required=False)
    replace_existing = serializers.BooleanField(required=False)
    min_block_minutes = serializers.IntegerField(
        min_value=15, max_value=240, required=False
    )
