from rest_framework import permissions, viewsets
from core.models import SpecialDates
from core.serializers.special_dates import SpecialDatesSerializer


class SpecialDatesViewSet(viewsets.ModelViewSet):
    serializer_class = SpecialDatesSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = SpecialDates.objects.none()

    def get_queryset(self):
        return SpecialDates.objects.filter(user=self.request.user).order_by("date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
