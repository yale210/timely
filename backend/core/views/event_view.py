from django.conf import settings
from django.utils import timezone
from typing import Any, cast
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Event
from core.serializers.event_serializer import (
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
from core.views.event_view_helpers import (
    LIST_WINDOW_PARAMETERS,
    REVERT_PARAMETERS,
    SCOPE_PARAMETERS,
    parse_list_window,
    parse_original_start_time,
    parse_scope_context,
    validate_revert,
    validate_scope,
)


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
    """Manage event CRUD operations, including recurrence-scope mutations."""

    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return the authenticated user's events.

        Returns:
            Any: QuerySet of events owned by the current user.
        """
        return cast(Any, Event).objects.filter(user=self.request.user).order_by("id")

    def list(self, request, *args, **kwargs):
        """List events or expanded recurring instances for the requested window.

        Returns:
            Response: Serialised event list response.
        """
        if not settings.ENABLE_RECURRENCE_OVERRIDES:
            return super().list(request, *args, **kwargs)

        range_start, range_end = parse_list_window(request)
        expanded_instances = expand_user_events(request.user, range_start, range_end)
        return Response(
            ExpandedEventInstanceSerializer(expanded_instances, many=True).data
        )

    def update(self, request, *args, **kwargs):
        """Handle full event updates.

        Returns:
            Response: Updated event response.
        """
        return self._handle_update(request, partial=False, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Handle partial event updates.

        Returns:
            Response: Updated event response.
        """
        return self._handle_update(request, partial=True, *args, **kwargs)

    def _handle_update(self, request, partial, *args, **kwargs):
        """Apply scoped recurrence updates while preserving series integrity.

        Args:
            request (Request): The DRF request object containing scope metadata.
            partial (bool): Whether the update should behave like PATCH.
            *args: Variable positional arguments passed to DRF handlers.
            **kwargs: Variable keyword arguments passed to DRF handlers.

        Returns:
            Response: A DRF response for the requested update scope.
        """
        event = self.get_object()
        scope, original_start_time = parse_scope_context(request)

        if event.recurrence_interval and not settings.ENABLE_RECURRENCE_OVERRIDES:
            if scope != "all":
                return Response(
                    {"detail": "Recurring scope updates are disabled by feature flag."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return super().update(request, *args, partial=partial, **kwargs)

        if event.recurrence_interval and settings.ENABLE_RECURRENCE_OVERRIDES:
            error = validate_scope(scope, original_start_time)
            if error:
                return error

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
                return Response(
                    {"detail": str(exc)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(EventResponseSerializer(updated_event).data)

        return super().update(request, *args, partial=partial, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete an event or recurring slice based on the requested scope.

        Returns:
            Response: Deletion response.
        """
        event = self.get_object()
        scope, original_start_time = parse_scope_context(request)

        if event.recurrence_interval and not settings.ENABLE_RECURRENCE_OVERRIDES:
            if scope != "all":
                return Response(
                    {"detail": "Recurring scope deletes are disabled by feature flag."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return super().destroy(request, *args, **kwargs)

        if event.recurrence_interval and settings.ENABLE_RECURRENCE_OVERRIDES:
            error = validate_scope(scope, original_start_time)
            if error:
                return error

            if scope == "all":
                return super().destroy(request, *args, **kwargs)
            apply_delete_scope(event, scope, original_start_time)
            return Response(status=status.HTTP_204_NO_CONTENT)

        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        parameters=REVERT_PARAMETERS,
        request=None,
        responses={status.HTTP_204_NO_CONTENT: None},
    )
    @action(detail=True, methods=["post"], url_path="revert-instance")
    def revert_instance(self, request, *args, **kwargs):
        """Revert a single overridden recurring instance back to the base series.

        Returns:
            Response: Revert result response.
        """
        event = self.get_object()

        original_start_time = parse_original_start_time(request)
        error = validate_revert(event, original_start_time)
        if error:
            return error
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
        """Return the current server time.

        Returns:
            Response: Current server time payload.
        """
        return Response({"server_time": timezone.now().isoformat()})
