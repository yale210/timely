from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.test import RequestFactory, TestCase
from django.utils import timezone

from core.middleware.user_timezone import UserTimezoneMiddleware
from core.models import Preference
from core.tests.factories import UserFactory


class UserTimezoneMiddlewareTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_activates_authenticated_users_preference_timezone(self):
        user = UserFactory()
        Preference.objects.update_or_create(
            user=user,
            defaults={"timezone": "America/New_York"},
        )
        request = self.factory.get("/api/preferences/me/")
        request.user = user

        def get_response(_request):
            return HttpResponse(timezone.get_current_timezone_name())

        response = UserTimezoneMiddleware(get_response)(request)

        self.assertEqual(response.content.decode(), "America/New_York")
        self.assertEqual(timezone.get_current_timezone_name(), settings.TIME_ZONE)

    def test_falls_back_to_project_timezone_for_anonymous_requests(self):
        request = self.factory.get("/api/preferences/me/")
        request.user = AnonymousUser()

        def get_response(_request):
            return HttpResponse(timezone.get_current_timezone_name())

        response = UserTimezoneMiddleware(get_response)(request)

        self.assertEqual(response.content.decode(), settings.TIME_ZONE)
        self.assertEqual(timezone.get_current_timezone_name(), settings.TIME_ZONE)

    def test_falls_back_to_project_timezone_for_invalid_user_timezone(self):
        user = UserFactory()
        Preference.objects.update_or_create(
            user=user,
            defaults={"timezone": "Invalid/Timezone"},
        )
        request = self.factory.get("/api/preferences/me/")
        request.user = user

        def get_response(_request):
            return HttpResponse(timezone.get_current_timezone_name())

        response = UserTimezoneMiddleware(get_response)(request)

        self.assertEqual(response.content.decode(), settings.TIME_ZONE)
        self.assertEqual(timezone.get_current_timezone_name(), settings.TIME_ZONE)
