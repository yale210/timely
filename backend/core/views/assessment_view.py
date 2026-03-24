from django_filters import rest_framework as django_filters
from rest_framework import filters, permissions, viewsets

from core.models import Assessment
from core.serializers import AssessmentSerializer


class AssessmentFilter(django_filters.FilterSet):
    categories = django_filters.BaseInFilter(
        field_name="categories__id", lookup_expr="in"
    )

    class Meta:
        model = Assessment
        fields = ["completed", "assessment_type", "categories"]


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.none()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AssessmentFilter
    ordering_fields = [
        "due_date",
        "created_at",
        "updated_at",
        "weighting_of_assessment",
    ]

    def get_queryset(self):
        return (
            Assessment.objects.filter(user=self.request.user)
            .select_related("assessment_category", "module_category", "linked_event")
            .prefetch_related(
                "categories", "linked_event__categories", "linked_event__reminders"
            )
            .order_by("due_date", "id")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        linked_event = instance.linked_event
        super().perform_destroy(instance)
        if linked_event is not None:
            linked_event.delete()
