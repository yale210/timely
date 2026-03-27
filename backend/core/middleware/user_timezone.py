"""Middleware for activating a user's preferred timezone."""

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.utils import timezone


class UserTimezoneMiddleware:
    """
    Activate the authenticated user's preferred timezone for the lifetime of
    the request so view-level `localdate()` / `get_current_timezone()` calls
    reflect user preferences instead of the global project default.
    """

    def __init__(self, get_response):
        """Store the downstream response callable."""

        self.get_response = get_response

    def __call__(self, request):
        """Activate the resolved timezone for the duration of the request."""

        selected_timezone = None
        user = getattr(request, "user", None)

        if getattr(user, "is_authenticated", False):
            user_timezone = getattr(getattr(user, "preference", None), "timezone", None)
            if user_timezone:
                try:
                    selected_timezone = ZoneInfo(user_timezone)
                except ZoneInfoNotFoundError:
                    selected_timezone = None

        if selected_timezone is None:
            timezone.activate(settings.TIME_ZONE)
        else:
            timezone.activate(selected_timezone)

        try:
            return self.get_response(request)
        finally:
            timezone.deactivate()
