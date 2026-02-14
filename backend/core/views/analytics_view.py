from datetime import datetime

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.summary import WeeklySummarySerializer
from ..utils.stats import calculate_weekly_stats


def _parse_date(date_str: str | None):
    """Parse YYYY-MM-DD into a date, or return None on failure/omission."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None


class WeeklySummaryView(APIView):
    """Retrieve weekly statistics for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get("date")
        parsed = _parse_date(date_str)
        now_dt = timezone.now() if parsed is None else timezone.make_aware(datetime.combine(parsed, datetime.min.time()))
        stats = calculate_weekly_stats(request.user, now=now_dt)
        serializer = WeeklySummarySerializer(stats)
        return Response(serializer.data)
