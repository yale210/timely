from rest_framework import permissions, viewsets
from core.models import Assessment
from core.serializers import AssessmentSerializer


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Assessment.objects.filter(user=self.request.user).order_by("due_date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
