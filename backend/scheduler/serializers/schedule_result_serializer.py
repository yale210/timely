"""Serializers for the scheduler application."""

from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers


class ScheduleResultSerializer(serializers.Serializer):
    """Serializer for scheduling results.

    This serializer formats the output of the scheduling engine, providing
    details on whether a task was successfully scheduled and its time range.
    """

    task_id = serializers.IntegerField()
    success = serializers.BooleanField()
    scheduled_start = serializers.DateTimeField(allow_null=True)
    scheduled_end = serializers.DateTimeField(allow_null=True)
    reason = serializers.CharField(allow_null=True, required=False)
    segments = serializers.SerializerMethodField()

    @extend_schema_field(
        inline_serializer(
            name="ScheduleSegment",
            fields={
                "start": serializers.DateTimeField(),
                "end": serializers.DateTimeField(),
            },
            many=True,
        )
    )
    def get_segments(self, instance):
        """Retrieve and format the segments of a scheduled task.

        Args:
            instance: The ScheduleResult instance.

        Returns:
            A list of dictionary objects representing scheduled segments, or None.
        """
        segments = getattr(instance, "segments", None)
        if segments is None:
            return None
        return [{"start": start, "end": end} for start, end in segments]
