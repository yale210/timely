"""Serializers for weekly summaries.

These are thin, read-only serializers used to return the computed
weekly summary from utility functions or views.
"""

from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers


class WeeklySummarySerializer(serializers.Serializer):
    """Serializer for a weekly task summary.

    Fields:
      - total_tasks (int)
      - completed_tasks (int)
      - completion_percentage (float)
      - total_minutes_planned (int)
    """

    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    completion_percentage = serializers.FloatField()
    total_minutes_planned = serializers.IntegerField()
    # Breakdown fields returned from utils.stats; keep read-only to avoid write paths
    daily_stats = serializers.SerializerMethodField()
    importance_stats = serializers.SerializerMethodField()

    @extend_schema_field(
        inline_serializer(
            name="DailyStat",
            fields={
                "day": serializers.CharField(),
                "completed_count": serializers.IntegerField(),
                "total_minutes": serializers.IntegerField(),
            },
            many=True,
        )
    )
    def get_daily_stats(self, obj):
        return obj.get("daily_stats", [])

    @extend_schema_field(
        inline_serializer(
            name="ImportanceStat",
            fields={
                "level": serializers.IntegerField(),
                "completed_count": serializers.IntegerField(),
            },
            many=True,
        )
    )
    def get_importance_stats(self, obj):
        return obj.get("importance_stats", [])
