"""Views and filters for calendar tasks and categories."""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django_filters import rest_framework as django_filters
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Category, Task
from core.serializers.calendar_serializer import (
    CalendarResponseSerializer,
    CalendarSerializer,
)
from core.serializers.category_serializer import CategorySerializer
from scheduler.services import Scheduler


class TaskFilter(django_filters.FilterSet):
    """Filter set for Task objects in the calendar view.

    Attributes:
        categories: Filter tasks by a list of category IDs.
        start_time__gte: Filter tasks starting on or after a specific datetime.
        deadline__lte: Filter tasks due on or before a specific datetime.

    """

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
        """Meta options for TaskFilter."""

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
    """ViewSet for managing tasks in the calendar context.

    Provides CRUD operations for tasks and a custom action for rescheduling.
    """

    queryset = Task.objects.none()
    serializer_class = CalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [django_filters.DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TaskFilter
    ordering_fields = ["importance", "deadline", "estimated_minutes", "start_time"]

    def get_queryset(self):
        """Retrieve tasks for the current user ordered by start time.

        Returns:
            QuerySet: A filtered queryset of Task objects.

        """
        return Task.objects.filter(user=self.request.user).order_by("start_time")

    def perform_create(self, serializer):
        """Save the new task linked to the current user.

        Args:
            serializer (BaseSerializer): The serializer instance containing validated data.

        """
        serializer.save(user=self.request.user)

    def _append_profile_metadata(self, response, profile, user_profile_level_before):
        """Append level and XP metadata to the response data.

        Args:
            response (Response): The original DRF response.
            profile (UserProfile): The user's profile instance.
            user_profile_level_before (int): The profile level before the update.

        Returns:
            Response: The updated response with level-up metadata.

        """
        profile.refresh_from_db()
        level_up = profile.level > user_profile_level_before

        response.data["level_up"] = level_up
        response.data["new_level"] = profile.level
        response.data["xp"] = profile.xp
        return response

    def update(self, request, *args, **kwargs):
        """Update a task and include profile metadata in the response.

        Args:
            request (Request): The DRF request object.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: A DRF response containing updated task data and metadata.

        """
        profile = request.user.user_profile
        user_profile_level_before = profile.level

        response = super().update(request, *args, **kwargs)
        return self._append_profile_metadata(
            response, profile, user_profile_level_before
        )

    def partial_update(self, request, *args, **kwargs):
        """Partial update a task and include profile metadata in the response.

        Args:
            request (Request): The DRF request object.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: A DRF response containing updated task data and metadata.

        """
        profile = request.user.user_profile
        user_profile_level_before = profile.level

        response = super().partial_update(request, *args, **kwargs)
        return self._append_profile_metadata(
            response, profile, user_profile_level_before
        )

    def _prepare_save_and_reschedule_serializer(self, task, payload):
        mutable_payload = payload.copy()
        mutable_payload["allocation"] = []
        serializer = self.get_serializer(task, data=mutable_payload, partial=True)
        serializer.is_valid(raise_exception=True)
        return serializer

    def _parse_reschedule_start_date(self, raw_start_date):
        if not raw_start_date:
            return timezone.localdate()

        try:
            return timezone.datetime.fromisoformat(raw_start_date).date()
        except ValueError as exc:
            raise serializers.ValidationError(
                {"start_date": "Start date must be a valid YYYY-MM-DD date."}
            ) from exc

    @staticmethod
    def _get_max_days_ahead(user):
        preference = getattr(user, "preference", None)
        return getattr(preference, "max_days_ahead", 30)

    @staticmethod
    def _clear_reschedulable_allocations(user, task_id):
        Task.objects.filter(user=user).exclude(allocation=[]).filter(
            completed=False
        ).filter(Q(locked=False) | Q(id=task_id)).update(
            allocation=[], total_task_allocations=0
        )

    @staticmethod
    def _build_scheduler(user, task_id, max_days_ahead):
        return Scheduler(
            user,
            max_days_ahead=max_days_ahead,
            allow_split=True,
            min_block_minutes=30,
            include_locked_task_ids=[task_id],
        )

    @staticmethod
    def _get_schedule_result(results, task_id):
        return next(
            (
                schedule_result
                for schedule_result in results
                if schedule_result.task_id == task_id
            ),
            None,
        )

    @staticmethod
    def _get_reschedule_warning(result):
        if result and result.success and result.segments:
            return None
        if result and result.reason:
            return result.reason
        return "Could not reschedule the task."

    @staticmethod
    def _serialise_allocation(segments):
        return [
            {"start": start.isoformat(), "end": end.isoformat()}
            for start, end in segments
        ]

    def _persist_schedule_results(self, user, task, results):
        for schedule_result in results:
            segments = schedule_result.segments or []
            if not schedule_result.success or not segments:
                continue
            try:
                scheduled_task = Task.objects.get(id=schedule_result.task_id, user=user)
            except Task.DoesNotExist:
                continue

            allocation = self._serialise_allocation(segments)
            scheduled_task.allocation = allocation
            scheduled_task.total_task_allocations = len(allocation)
            scheduled_task.save(update_fields=["allocation", "total_task_allocations"])
            if scheduled_task.id == task.id:
                task = scheduled_task

        return task

    def _reschedule_task_allocations(self, user, task, start_date, max_days_ahead):
        self._clear_reschedulable_allocations(user, task.id)
        task.allocation = []
        task.total_task_allocations = 0

        scheduler = self._build_scheduler(user, task.id, max_days_ahead)
        results = scheduler.schedule_tasks(start_date=start_date)
        warning = self._get_reschedule_warning(
            self._get_schedule_result(results, task.id)
        )
        task = self._persist_schedule_results(user, task, results)
        return task, warning

    def _build_save_and_reschedule_response(
        self,
        task,
        profile,
        user_profile_level_before,
        reschedule_warning,
    ):
        response = Response(
            CalendarResponseSerializer(task).data,
            status=status.HTTP_200_OK,
        )
        if reschedule_warning:
            response.data["reschedule_warning"] = reschedule_warning
        return self._append_profile_metadata(
            response, profile, user_profile_level_before
        )

    @action(detail=True, methods=["post"], url_path="save-and-reschedule")
    def save_and_reschedule(self, request, *args, **kwargs):
        """Save task changes and trigger a full reschedule for the user.

        Args:
            request (Request): The DRF request object.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: A DRF response with the updated task and reschedule status.

        """
        profile = request.user.user_profile
        user_profile_level_before = profile.level
        task = self.get_object()
        serializer = self._prepare_save_and_reschedule_serializer(task, request.data)
        start_date = self._parse_reschedule_start_date(request.data.get("start_date"))
        max_days_ahead = self._get_max_days_ahead(request.user)

        with transaction.atomic():
            task = serializer.save()

        with transaction.atomic():
            task, reschedule_warning = self._reschedule_task_allocations(
                request.user,
                task,
                start_date,
                max_days_ahead,
            )

        return self._build_save_and_reschedule_response(
            task,
            profile,
            user_profile_level_before,
            reschedule_warning,
        )


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user categories."""

    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Category.objects.all()
