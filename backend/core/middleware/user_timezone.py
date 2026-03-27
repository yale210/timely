"""Middleware for activating a user's preferred timezone."""

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.utils import timezone


class UserTimezoneMiddleware:
    """Activate the request user's timezone so date-aware views match preferences.

    The middleware resolves an authenticated user's saved IANA timezone and
    activates it for the request lifetime. That keeps calendar and scheduling
    responses aligned with the user's local day boundaries instead of the
    project default timezone.
    """

    def __init__(self, get_response):
        """Store the downstream response callable used to continue the chain.

        Args:
            get_response (Callable): The next middleware or view callable.
        """
        self.get_response = get_response

    def _get_timezone_to_activate(self, request):
        """Resolve the timezone that should be active for the current request.

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            ZoneInfo | str: The user's configured timezone when valid, otherwise
                the project default timezone string.
        """
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

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            HttpResponse: The downstream response.

        """
        timezone.activate(self._get_timezone_to_activate(request))

        try:
            return self.get_response(request)
        finally:
            timezone.deactivate()
