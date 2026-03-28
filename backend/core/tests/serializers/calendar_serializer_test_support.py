"""Shared fixtures for calendar serializer tests."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from core.models import Category


class CalendarSerializerTestSupport(TestCase):
    """Base fixtures for calendar serializer test cases."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="serializeruser", password="password123", email="test@user.com"
        )
        self.request_factory = APIRequestFactory()
        self.category1 = Category.objects.create(user=self.user, text="Study")
        self.category2 = Category.objects.create(user=self.user, text="Work")

    def _request_context(self):
        """Build serializer request context."""
        request = self.request_factory.post("/api/tasks/")
        request.user = self.user
        return {"request": request}

    def _base_data(self, **overrides):
        """Build base serializer payload data."""
        now = timezone.now() + datetime.timedelta(days=1)
        data = {
            "title": "Task",
            "description": "",
            "estimated_minutes": 60,
            "completed_minutes": 0,
            "start_time": now.isoformat(),
            "deadline": (now + datetime.timedelta(hours=3)).isoformat(),
            "importance": 5,
            "completed": False,
            "categories": [],
            "allocation": [],
        }
        data.update(overrides)
        return data
