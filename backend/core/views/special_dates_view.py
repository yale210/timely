"""Viewset for managing special dates like holidays or exams."""

from rest_framework import permissions, viewsets
from core.models import SpecialDates
from core.serializers.special_dates_serializer import SpecialDatesSerializer


class SpecialDatesViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing special dates.

    Provides actions for all standard CRUD operations on SpecialDates model.
    Querysets are scoped to the authenticated user.
    """

    serializer_class = SpecialDatesSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = SpecialDates.objects.none()

    def get_queryset(self):
        """Retrieve the special dates for the authenticated user.

        Returns:
            QuerySet: Filtered SpecialDates objects ordered by date.

        """
        return SpecialDates.objects.filter(user=self.request.user).order_by("date")

    def perform_create(self, serializer):
        """Save a new special date associated with the user.

        Args:
            serializer (Serializer): The DRF serializer for SpecialDates.

        """
        serializer.save(user=self.request.user)



