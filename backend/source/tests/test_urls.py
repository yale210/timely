"""Tests for top-level URL routing in the source package."""

import sys
from importlib import reload
from unittest.mock import patch

from django.db import DatabaseError
from django.conf import settings
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse


class SourceUrlsTest(SimpleTestCase):
    """Tests for the main URL configuration."""

    def _reload_urls(self):
        """Reload the top-level URL module after a settings override.

        Returns:
            list: The reloaded ``urlpatterns`` sequence.
        """
        if "source.urls" in sys.modules:
            del sys.modules["source.urls"]
        import source.urls

        reload(source.urls)
        return source.urls.urlpatterns

    def _assert_reverse_path(self, name, expected_path, **kwargs):
        """Assert that a named URL resolves to the expected path.

        Args:
            name: The Django URL name to reverse.
            expected_path: The expected concrete path string.
            **kwargs: Optional URL kwargs passed to ``reverse``.
        """
        self.assertEqual(reverse(name, kwargs=kwargs or None), expected_path)

    @override_settings(DEBUG=True)
    def test_urls_debug_true(self):
        """Verify that media URLs are added when DEBUG is True."""
        urlpatterns = self._reload_urls()
        media_routes = [
            p
            for p in urlpatterns
            if hasattr(p, "pattern") and settings.MEDIA_URL.strip("/") in str(p.pattern)
        ]
        self.assertTrue(len(media_routes) > 0)

    @override_settings(DEBUG=False)
    def test_urls_debug_false(self):
        """Verify that media URLs are not added when DEBUG is False."""
        urlpatterns = self._reload_urls()
        media_routes = [
            p
            for p in urlpatterns
            if hasattr(p, "pattern") and settings.MEDIA_URL.strip("/") in str(p.pattern)
        ]
        self.assertEqual(len(media_routes), 0)

    def test_named_source_routes_reverse_expected_paths(self):
        """Verify core named top-level routes reverse to stable API paths."""
        self._assert_reverse_path("health-check", "/api/health/")
        self._assert_reverse_path("schedule-tasks", "/api/schedule/")
        self._assert_reverse_path("unschedule-tasks", "/api/unschedule/")
        self._assert_reverse_path("weekly-summary", "/api/stats/weekly/")
        self._assert_reverse_path("export-events", "/api/export/")
        self._assert_reverse_path("import-events", "/api/import/")
        self._assert_reverse_path("admin:index", "/api/django-admin/")

    def test_included_auth_and_profile_routes_reverse_expected_paths(self):
        """Verify included authentication and profile routes stay mounted correctly."""
        self._assert_reverse_path("register", "/api/authentication/register/")
        self._assert_reverse_path("login", "/api/authentication/session/")
        self._assert_reverse_path("logout", "/api/authentication/logout/")
        self._assert_reverse_path("logoutall", "/api/authentication/logoutall/")
        self._assert_reverse_path("profile", "/api/profiles/")
        self._assert_reverse_path("leaderboard", "/api/profiles/leaderboard/")
        self._assert_reverse_path(
            "public-profile",
            "/api/profiles/alice/",
            username="alice",
        )

    def test_router_and_admin_routes_reverse_expected_paths(self):
        """Verify router-backed endpoints remain mounted under the expected prefixes."""
        self._assert_reverse_path("task-list", "/api/tasks/")
        self._assert_reverse_path("grade-list", "/api/grades/")
        self._assert_reverse_path("category-list", "/api/categories/")
        self._assert_reverse_path("event-list", "/api/events/")
        self._assert_reverse_path("preference-list", "/api/preferences/")
        self._assert_reverse_path("friendship-list", "/api/friendships/")
        self._assert_reverse_path("special-dates-list", "/api/special-dates/")
        self._assert_reverse_path("notification-list", "/api/notifications/")
        self._assert_reverse_path("push-list", "/api/push/")
        self._assert_reverse_path("admin-users", "/api/admin/users/")


class HealthCheckTest(TestCase):
    """Tests for the deployment health endpoint."""

    def test_health_check_reports_database_ready(self):
        """Verify hosting health checks can confirm database connectivity."""
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    @patch("source.views.connection.cursor", side_effect=DatabaseError)
    def test_health_check_reports_database_unavailable(self, _cursor):
        """Verify a failed database connection makes the readiness check fail."""
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})
