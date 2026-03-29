"""Tests for calendar response serializer behaviour."""

import datetime

from django.utils import timezone

from core.models import Task
from core.serializers.calendar_serializer import CalendarResponseSerializer

from .calendar_serializer_test_support import CalendarSerializerTestSupport


class CalendarResponseSerializerTests(CalendarSerializerTestSupport):
    """Test cases for calendar response serializer."""
    def test_calendar_response_serializer_covers_representation_and_validation(self):
        """Test calendar response serializer covers representation and validation."""
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Response task",
            description="",
            estimated_minutes=90,
            completed_minutes=30,
            start_time=now,
            deadline=now + datetime.timedelta(hours=2),
            importance=5,
        )
        task.categories.add(self.category1)

        data = CalendarResponseSerializer(task).data
        self.assertEqual(data["remaining_minutes"], 60)
        self.assertEqual(data["categories"][0]["text"], self.category1.text)

        serializer = CalendarResponseSerializer(
            instance=task,
            data={"min_split_minutes": 60, "max_split_minutes": 30},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("max_split_minutes", serializer.errors)
