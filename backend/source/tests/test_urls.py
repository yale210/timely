from django.conf import settings
from django.test import SimpleTestCase, override_settings
from importlib import reload
import sys


class SourceUrlsTest(SimpleTestCase):
    """Tests for the main URL configuration."""

    def _reload_urls(self):
        if "source.urls" in sys.modules:
            del sys.modules["source.urls"]
        import source.urls

        reload(source.urls)
        return source.urls.urlpatterns

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
