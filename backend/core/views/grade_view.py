from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from core.models import Grade
from core.serializers import GradeSerializer


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.none()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Grade.objects.filter(user=self.request.user).order_by("-date_achieved")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
