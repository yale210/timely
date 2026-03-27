"""Tests for core URL routing."""

from django.test import SimpleTestCase
from django.urls import resolve

from core.views.assessment_view import AssessmentViewSet
from core.views.calendar_view import TaskViewSet
from core.views.event_view import EventViewSet


class UrlTests(SimpleTestCase):
    """Test cases for url."""
    def test_assessments_url_resolves(self):
        """Test assessments url resolves."""
        resolver = resolve("/api/assessments/")

        self.assertEqual(resolver.func.cls, AssessmentViewSet)

    def test_tasks_url_resolves(self):
        """Test tasks url resolves."""
        resolver = resolve("/api/tasks/")

        self.assertEqual(resolver.func.cls, TaskViewSet)

    def test_events_url_resolves(self):
        """Test events url resolves."""
        resolver = resolve("/api/events/")

        self.assertEqual(resolver.func.cls, EventViewSet)
