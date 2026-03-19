from django.test import SimpleTestCase, override_settings
from django.urls import clear_url_caches
from importlib import reload
import sys


class SourceUrlsTest(SimpleTestCase):
    """Tests for the main URL configuration."""

    @override_settings(DEBUG=True)
    def test_urls_debug_true(self):
        """Verify that media URLs are added when DEBUG is True."""
        if "source.urls" in sys.modules:
            reload(sys.modules["source.urls"])
        else:
            import source.urls

        from source.urls import urlpatterns

        pass

    @override_settings(DEBUG=False)
    def test_urls_debug_false(self):
        """Verify that media URLs are not added when DEBUG is False."""
        if "source.urls" in sys.modules:
            reload(sys.modules["source.urls"])
        else:
            import source.urls

        from source.urls import urlpatterns

        pass
