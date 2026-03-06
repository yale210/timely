from calendar import monthrange
from datetime import datetime, time

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from core.models import Event
from core.serializers.event import (
    EventResponseSerializer,
    EventSerializer,
    ExpandedEventInstanceSerializer,
)
from core.services import (
    apply_delete_scope,
    apply_update_scope,
    expand_user_events,
    revert_override_instance,
)


VALID_SCOPES = {"this", "following", "all"}

LIST_WINDOW_PARAMETERS = [
    OpenApiParameter(
        "start_date",
        OpenApiTypes.DATE,
        OpenApiParameter.QUERY,
        description="Start date for flattened event expansion (YYYY-MM-DD).",
    ),
    OpenApiParameter(
        "end_date",
        OpenApiTypes.DATE,
        OpenApiParameter.QUERY,
        description="End date for flattened event expansion (YYYY-MM-DD).",
    ),
]

SCOPE_PARAMETERS = [
    OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
    OpenApiParameter(
        "scope",
        OpenApiTypes.STR,
        OpenApiParameter.QUERY,
        description="Mutation scope: this, following, all.",
    ),
    OpenApiParameter(
        "original_start_time",
        OpenApiTypes.DATETIME,
        OpenApiParameter.QUERY,
        description="UTC ISO datetime anchor of interacted recurring instance.",
    ),
]

REVERT_PARAMETERS = [
    OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
    OpenApiParameter(
        "original_start_time",
        OpenApiTypes.DATETIME,
        OpenApiParameter.QUERY,
        description="UTC ISO datetime anchor of the overridden recurring instance.",
        required=True,
    ),
]


@extend_schema_view(
    list=extend_schema(
        parameters=LIST_WINDOW_PARAMETERS,
        responses=ExpandedEventInstanceSerializer(many=True),
    ),
    retrieve=extend_schema(
        parameters=[
            OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH),
        ],
        responses=EventResponseSerializer,
    ),
    create=extend_schema(request=EventSerializer, responses=EventResponseSerializer),
    update=extend_schema(
        parameters=SCOPE_PARAMETERS,
        request=EventSerializer,
        responses=EventResponseSerializer,
    ),
    partial_update=extend_schema(
        parameters=SCOPE_PARAMETERS,
        request=EventSerializer,
        responses=EventResponseSerializer,
    ),
    destroy=extend_schema(parameters=SCOPE_PARAMETERS),
)
class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user).order_by("id")

    def _parse_list_window(self, request):
        start_date_raw = request.query_params.get("start_date")
        end_date_raw = request.query_params.get("end_date")

        if not start_date_raw or not end_date_raw:
            today = timezone.localdate()
            month_start = today.replace(day=1)
            month_end = today.replace(day=monthrange(today.year, today.month)[1])
        else:
            try:
                month_start = datetime.strptime(start_date_raw, "%Y-%m-%d").date()
                month_end = datetime.strptime(end_date_raw, "%Y-%m-%d").date()
            except ValueError as exc:
                raise ValidationError(
                    "start_date and end_date must use YYYY-MM-DD."
                ) from exc

        if month_end < month_start:
            raise ValidationError("end_date must be on or after start_date.")
        if (month_end - month_start).days > 365:
            raise ValidationError("Date range cannot exceed 366 days.")

        timezone_info = timezone.get_current_timezone()
        range_start = timezone.make_aware(
            datetime.combine(month_start, time.min),
            timezone_info,
        )
        range_end = timezone.make_aware(
            datetime.combine(month_end, time.max),
            timezone_info,
        )
        return range_start, range_end

    def _parse_original_start_time(self, request):
        original_start_time = None
        original_start_time_raw = request.query_params.get("original_start_time")
        if original_start_time_raw:
            original_start_time_raw = original_start_time_raw.replace(" ", "+")
            parsed_datetime = parse_datetime(original_start_time_raw)
            if parsed_datetime is None:
                raise ValidationError(
                    "original_start_time must be a valid ISO datetime."
                )
            if timezone.is_naive(parsed_datetime):
                parsed_datetime = timezone.make_aware(parsed_datetime)
            original_start_time = parsed_datetime
        return original_start_time

    def _parse_scope_context(self, request):
        scope = request.query_params.get("scope", "all").lower()
        if scope not in VALID_SCOPES:
            raise ValidationError("scope must be one of: this, following, all.")

        original_start_time = self._parse_original_start_time(request)

        return scope, original_start_time

    def list(self, request, *args, **kwargs):
        if not settings.ENABLE_RECURRENCE_OVERRIDES:
            return super().list(request, *args, **kwargs)

        range_start, range_end = self._parse_list_window(request)
        expanded_instances = expand_user_events(request.user, range_start, range_end)
        serializer = ExpandedEventInstanceSerializer(expanded_instances, many=True)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        return self._handle_update(request, partial=False, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self._handle_update(request, partial=True, *args, **kwargs)

    def _handle_update(self, request, partial, *args, **kwargs):
        event = self.get_object()
        scope, original_start_time = self._parse_scope_context(request)

        if event.recurrence_interval and not settings.ENABLE_RECURRENCE_OVERRIDES:
            if scope != "all":
                return Response(
                    {"detail": "Recurring scope updates are disabled by feature flag."},
                    status=400,
                )
            return super().update(request, *args, partial=partial, **kwargs)

        if event.recurrence_interval and settings.ENABLE_RECURRENCE_OVERRIDES:
            if scope in {"this", "following"} and original_start_time is None:
                return Response(
                    {"detail": "original_start_time is required for this scope."},
                    status=400,
                )
            serializer = self.get_serializer(event, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            try:
                updated_event = apply_update_scope(
                    event,
                    serializer.validated_data,
                    scope,
                    original_start_time,
                )
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=400)
            return Response(EventResponseSerializer(updated_event).data)

        return super().update(request, *args, partial=partial, **kwargs)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        scope, original_start_time = self._parse_scope_context(request)

        if event.recurrence_interval and not settings.ENABLE_RECURRENCE_OVERRIDES:
            if scope != "all":
                return Response(
                    {"detail": "Recurring scope deletes are disabled by feature flag."},
                    status=400,
                )
            return super().destroy(request, *args, **kwargs)

        if event.recurrence_interval and settings.ENABLE_RECURRENCE_OVERRIDES:
            if scope in {"this", "following"} and original_start_time is None:
                return Response(
                    {"detail": "original_start_time is required for this scope."},
                    status=400,
                )
            if scope == "all":
                return super().destroy(request, *args, **kwargs)
            apply_delete_scope(event, scope, original_start_time)
            return Response(status=204)

        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        parameters=REVERT_PARAMETERS,
        request=None,
        responses={status.HTTP_204_NO_CONTENT: None},
    )
    @action(detail=True, methods=["post"], url_path="revert-instance")
    def revert_instance(self, request, *args, **kwargs):
        event = self.get_object()

        original_start_time = self._parse_original_start_time(request)

        error = self._validate_revert(event, request, original_start_time)

        if error:
            return error

        return self._perform_revert(event, original_start_time)

    def _validate_revert(self, event, original_start_time):
        if not settings.ENABLE_RECURRENCE_OVERRIDES:
            return Response(
                {"detail": "Recurring overrides are disabled by feature flag."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not event.recurrence_interval:
            return Response(
                {"detail": "Only recurring events support override reverts."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if original_start_time is None:
            return Response(
                {"detail": "original_start_time is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def _perform_revert(self, event, original_start_time):
        try:
            revert_override_instance(event, original_start_time)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        responses=inline_serializer(
            name="ServerTimeResponseSerializer",
            fields={"server_time": serializers.CharField()},
        ),
    )
    @action(detail=False, methods=["get"])
    def server_time(self, request):
        return Response({"server_time": timezone.now().isoformat()})
