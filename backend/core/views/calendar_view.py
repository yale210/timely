from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from core.models import Task, Category
from core.serializers.calendar import CalendarSerializer
from core.serializers.category_serializer import CategorySerializer


class TaskFilter(django_filters.FilterSet):
    categories = django_filters.BaseInFilter(
        field_name="categories__id", lookup_expr="in"
    )
    start_time__gte = django_filters.IsoDateTimeFilter(
        field_name="start_time", lookup_expr="gte"
    )
    deadline__lte = django_filters.IsoDateTimeFilter(
        field_name="deadline", lookup_expr="lte"
    )

    class Meta:
        model = Task
        fields = ["completed", "categories", "start_time__gte", "deadline__lte"]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TaskFilter
    ordering_fields = ["importance", "deadline", "estimated_minutes", "start_time"]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by("start_time")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Category.objects.all()
