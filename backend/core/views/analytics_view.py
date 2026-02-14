from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.summary import WeeklySummarySerializer
from ..utils.stats import calculate_weekly_stats


class WeeklySummaryView(APIView):
    """Retrieve weekly statistics for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = calculate_weekly_stats(request.user)
        serializer = WeeklySummarySerializer(stats)
        return Response(serializer.data)
