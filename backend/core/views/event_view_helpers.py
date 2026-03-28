from calendar import monthrange
from datetime import datetime, time

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

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


def parse_list_window(request):
    """Parse the flattened recurrence list window from query parameters.

    Returns:
        tuple[datetime, datetime]: Aware datetime bounds for the requested window.

    Raises:
        ValidationError: If the supplied date parameters are invalid.
    """
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
        raise ValidationError("Date range cannot exceed 365 days.")
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


def parse_original_start_time(request):
    """Parse the recurring instance anchor from the request.

    Returns:
        datetime | None: Parsed aware anchor datetime when provided.

    Raises:
        ValidationError: If the supplied datetime cannot be parsed.
    """
    original_start_time_raw = request.query_params.get("original_start_time")
    if not original_start_time_raw:
        return None
    parsed_datetime = parse_datetime(original_start_time_raw.replace(" ", "+"))
    if parsed_datetime is None:
        raise ValidationError("original_start_time must be a valid ISO datetime.")
    if timezone.is_naive(parsed_datetime):
        parsed_datetime = timezone.make_aware(parsed_datetime)
    return parsed_datetime


def parse_scope_context(request):
    """Resolve scope and recurring instance anchor from request parameters.

    Returns:
        tuple[str, datetime | None]: Requested scope and parsed anchor datetime.

    Raises:
        ValidationError: If the supplied scope is invalid.
    """
    scope = request.query_params.get("scope", "all").lower()
    if scope not in VALID_SCOPES:
        raise ValidationError("scope must be one of: this, following, all.")
    return scope, parse_original_start_time(request)


def validate_scope(scope, original_start_time):
    """Validate whether the supplied scope has the required anchor value.

    Returns:
        Response | None: Error response when the scope is invalid, otherwise None.
    """
    if scope in {"this", "following"} and original_start_time is None:
        return Response(
            {"detail": "original_start_time is required for this scope."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def validate_revert(event, original_start_time):
    """Validate whether a revert request can be processed.

    Returns:
        Response | None: Error response when the revert is invalid, otherwise None.
    """
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
