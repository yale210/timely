"""Tests for course URL routing."""

from django.test import SimpleTestCase

from courses import urls


class CourseUrlsTests(SimpleTestCase):
    """Test cases for course urls."""

    def test_course_urls_module_exposes_router_urlpatterns(self):
        """Test course urls module exposes router urlpatterns."""
        self.assertEqual(len(urls.urlpatterns), 1)
        self.assertTrue(urls.urlpatterns[0])
