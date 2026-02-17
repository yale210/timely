from rest_framework import serializers


class ScheduleRequestSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    max_days_ahead = serializers.IntegerField(min_value=1, max_value=30, required=False)
    allow_split = serializers.BooleanField(required=False)
    min_block_minutes = serializers.IntegerField(
        min_value=15, max_value=240, required=False
    )


class ScheduleResultSerializer(serializers.Serializer):
    segments = serializers.ListField(
        child=serializers.DictField(child=serializers.DateTimeField()),
        required=False,
    )
    task_id = serializers.IntegerField()
    success = serializers.BooleanField()
    scheduled_start = serializers.DateTimeField(allow_null=True)
    scheduled_end = serializers.DateTimeField(allow_null=True)
    reason = serializers.CharField(allow_null=True, required=False)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        segments = getattr(instance, "segments", None)
        if segments is not None:
            representation["segments"] = [
                {"start": start, "end": end} for start, end in segments
            ]
        return representation
