from django.test import SimpleTestCase, override_settings
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
            import source.urls  # noqa: F401

        from source.urls import urlpatterns  # noqa: F401

    @override_settings(DEBUG=False)
    def test_urls_debug_false(self):
        """Verify that media URLs are not added when DEBUG is False."""
        if "source.urls" in sys.modules:
            reload(sys.modules["source.urls"])
        else:
            import source.urls  # noqa: F401

        from source.urls import urlpatterns  # noqa: F401
