from rest_framework import permissions, viewsets
from core.models import Assessment
from core.serializers import (
    AssessmentSerializer,
    delete_assessment_event,
    create_assessment_event,
)


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Assessment.objects.filter(user=self.request.user).order_by("due_date")

    def perform_create(self, serializer):
        assessment = serializer.save(user=self.request.user)
        create_assessment_event(assessment)
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        delete_assessment_event(instance)
        instance.delete()
