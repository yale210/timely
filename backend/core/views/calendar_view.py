from rest_framework import viewsets, permissions, filters
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from django_filters import rest_framework as django_filters
from core.models import Task, Category
from core.serializers.calendar import CalendarSerializer, CalendarResponseSerializer
from core.serializers.category import CategorySerializer


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


@extend_schema_view(
    list=extend_schema(responses=CalendarResponseSerializer(many=True)),
    create=extend_schema(
        request=CalendarSerializer,
        responses={201: CalendarResponseSerializer},
    ),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
        ],
        responses=CalendarResponseSerializer,
    ),
    update=extend_schema(
        parameters=[
            OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
        ],
        request=CalendarSerializer,
        responses=CalendarResponseSerializer,
    ),
    partial_update=extend_schema(
        parameters=[
            OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
        ],
        request=CalendarSerializer,
        responses=CalendarResponseSerializer,
    ),
    destroy=extend_schema(
        parameters=[
            OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
        ]
    ),
)
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.none()
    serializer_class = CalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TaskFilter
    ordering_fields = ["importance", "deadline", "estimated_minutes", "start_time"]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by("start_time")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        profile = request.user.user_profile
        user_profile_level_before = profile.level
        
        response = super().update(request, *args, **kwargs)
    
        profile.refresh_from_db()
        level_up = profile.level > user_profile_level_before

        response.data["level_up"] = level_up
        response.data["new_level"] = request.user.user_profile.level
        response.data["xp"] = profile.xp
        return response
    

    def partial_update(self, request, *args, **kwargs):
        profile = request.user.user_profile
        user_profile_level_before = profile.level
        
        response = super().partial_update(request, *args, **kwargs)
    
        profile.refresh_from_db()
        level_up = profile.level > user_profile_level_before

        response.data["level_up"] = level_up
        response.data["new_level"] = request.user.user_profile.level
        response.data["xp"] = profile.xp
        return response



class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Category.objects.all()
