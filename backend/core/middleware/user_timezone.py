"""Middleware for activating a user's preferred timezone."""

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.utils import timezone


class UserTimezoneMiddleware:
    """Activate the authenticated user's preferred timezone for the lifetime of a request.

    the request so view-level `localdate()` / `get_current_timezone()` calls
    reflect user preferences instead of the global project default.
    """

    def __init__(self, get_response):
        """Store the downstream response callable."""
        self.get_response = get_response

    def _get_timezone_to_activate(self, request):
        user = getattr(request, "user", None)
        if not getattr(user, "is_authenticated", False):
            return settings.TIME_ZONE

        user_timezone = getattr(getattr(user, "preference", None), "timezone", None)
        if not user_timezone:
            return settings.TIME_ZONE

        try:
            return ZoneInfo(user_timezone)
        except ZoneInfoNotFoundError:
            return settings.TIME_ZONE

    def __call__(self, request):
        """Activate the resolved timezone for the duration of the request.

        Returns:
            HttpResponse: The downstream response.

        """
        timezone.activate(self._get_timezone_to_activate(request))

        try:
            return self.get_response(request)
        finally:
            timezone.deactivate()
