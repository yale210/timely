"""Tests for course detail helpers."""

from django.test import SimpleTestCase

import courses.views.details_view as details_module


class CourseDetailsModuleTests(SimpleTestCase):
    """Test cases for the course details helper module."""

    def test_details_module_imports_cleanly(self):
        """Test the details helper module imports cleanly."""
        self.assertEqual(details_module.__doc__, "Helpers for course detail responses.")

