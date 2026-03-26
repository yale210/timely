from rest_framework import serializers


class ScheduleRequestSerializer(serializers.Serializer):

    """Serializer for scheduling requests."""

    start_date = serializers.DateField(required=False)

    max_days_ahead = serializers.IntegerField(min_value=1, max_value=30, required=False)
    allow_split = serializers.BooleanField(required=False)
    replace_existing = serializers.BooleanField(required=False)
    min_block_minutes = serializers.IntegerField(
        min_value=15, max_value=240, required=False
    )


class ScheduleResultSerializer(serializers.Serializer):

    """Serializer for scheduling results."""

    task_id = serializers.IntegerField()
    success = serializers.BooleanField()
    scheduled_start = serializers.DateTimeField(allow_null=True)
    scheduled_end = serializers.DateTimeField(allow_null=True)
    reason = serializers.CharField(allow_null=True, required=False)
    segments = serializers.SerializerMethodField()

    def get_segments(self, instance):
        """
        Format scheduled segments.

        Args:
            instance (ScheduleResult): The result instance.

        Returns:
            list[dict[str, datetime]] | None: Formatted segments.
        """
        segments = getattr(instance, "segments", None)

        if segments is None:
            return None
        return [{"start": start, "end": end} for start, end in segments]
