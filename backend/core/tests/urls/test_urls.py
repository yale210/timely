from django.test import SimpleTestCase
from django.urls import resolve

from core.views.calendar_view import TaskViewSet


class UrlTests(SimpleTestCase):
    def test_tasks_url_resolves(self):
        resolver = resolve("/api/tasks/")

        self.assertEqual(resolver.func.cls, TaskViewSet)
