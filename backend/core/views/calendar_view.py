from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django_filters import rest_framework as django_filters
from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Category, Task
from core.serializers.calendar import CalendarResponseSerializer, CalendarSerializer
from core.serializers.category import CategorySerializer
from scheduler.services import Scheduler


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
        ],
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

    def _append_profile_metadata(self, response, profile, user_profile_level_before):
        profile.refresh_from_db()
        level_up = profile.level > user_profile_level_before

        response.data["level_up"] = level_up
        response.data["new_level"] = profile.level
        response.data["xp"] = profile.xp
        return response

    def update(self, request, *args, **kwargs):
        profile = request.user.user_profile
        user_profile_level_before = profile.level

        response = super().update(request, *args, **kwargs)
        return self._append_profile_metadata(
            response, profile, user_profile_level_before
        )

    def partial_update(self, request, *args, **kwargs):
        profile = request.user.user_profile
        user_profile_level_before = profile.level

        response = super().partial_update(request, *args, **kwargs)
        return self._append_profile_metadata(
            response, profile, user_profile_level_before
        )

    @action(detail=True, methods=["post"], url_path="save-and-reschedule")
    def save_and_reschedule(self, request, *args, **kwargs):
        profile = request.user.user_profile
        user_profile_level_before = profile.level
        task = self.get_object()

        payload = request.data.copy()
        payload["allocation"] = []
        serializer = self.get_serializer(task, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)

        raw_start_date = request.data.get("start_date")
        if raw_start_date:
            try:
                start_date = timezone.datetime.fromisoformat(raw_start_date).date()
            except ValueError as exc:
                raise serializers.ValidationError(
                    {"start_date": "Start date must be a valid YYYY-MM-DD date."}
                ) from exc
        else:
            start_date = timezone.localdate()

        preference = getattr(request.user, "preference", None)
        max_days_ahead = getattr(preference, "max_days_ahead", 30)

        with transaction.atomic():
            task = serializer.save()
            Task.objects.filter(user=request.user).exclude(allocation=[]).filter(
                completed=False
            ).filter(Q(locked=False) | Q(id=task.id)).update(
                allocation=[], total_task_allocations=0
            )
            task.allocation = []
            task.total_task_allocations = 0
            scheduler = Scheduler(
                request.user,
                max_days_ahead=max_days_ahead,
                allow_split=True,
                min_block_minutes=30,
                include_locked_task_ids=[task.id],
            )
            results = scheduler.schedule_tasks(start_date=start_date)
            result = next(
                (
                    schedule_result
                    for schedule_result in results
                    if schedule_result.task_id == task.id
                ),
                None,
            )
            if not result or not result.success or not result.segments:
                message = (
                    result.reason
                    if result and result.reason
                    else "Could not reschedule the task with the requested buffer."
                )
                field_errors = {}
                if "buffer_before_minutes" in request.data:
                    field_errors["buffer_before_minutes"] = [message]
                if "buffer_after_minutes" in request.data:
                    field_errors["buffer_after_minutes"] = [message]
                if not field_errors:
                    field_errors["non_field_errors"] = [message]
                raise serializers.ValidationError(field_errors)

            for schedule_result in results:
                segments = schedule_result.segments or []
                if not schedule_result.success or not segments:
                    continue
                try:
                    scheduled_task = Task.objects.get(
                        id=schedule_result.task_id, user=request.user
                    )
                except Task.DoesNotExist:
                    continue
                allocation = [
                    {"start": start.isoformat(), "end": end.isoformat()}
                    for start, end in segments
                ]
                scheduled_task.allocation = allocation
                scheduled_task.total_task_allocations = len(allocation)
                scheduled_task.save(
                    update_fields=["allocation", "total_task_allocations"]
                )
                if scheduled_task.id == task.id:
                    task = scheduled_task

        response = Response(
            CalendarResponseSerializer(task).data,
            status=status.HTTP_200_OK,
        )
        return self._append_profile_metadata(
            response, profile, user_profile_level_before
        )


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Category.objects.all()
