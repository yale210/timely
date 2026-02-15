"""Serializers for weekly summaries.

These are thin, read-only serializers used to return the computed
weekly summary from utility functions or views.
"""

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
    daily_stats = serializers.ReadOnlyField()
    importance_stats = serializers.ReadOnlyField()
