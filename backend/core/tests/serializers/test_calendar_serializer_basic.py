"""Tests for basic calendar serializer behaviour."""

import datetime

from django.utils import timezone

from core.models import Task
from core.serializers import CalendarSerializer

from .calendar_serializer_test_support import CalendarSerializerTestSupport


class CalendarSerializerBasicTests(CalendarSerializerTestSupport):
    """Test cases for calendar serializer basic."""
    def test_calendar_serializer_fields(self):
        """Test calendar serializer fields."""
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Read notes",
            description="Reading some notes for exam",
            estimated_minutes=60,
            start_time=now,
            completed=False,
            deadline=now + datetime.timedelta(days=2),
            importance=4,
        )
        task.categories.add(self.category1, self.category2)

        data = CalendarSerializer(task).data

        self.assertEqual(data["title"], "Read notes")
        self.assertEqual(data["description"], "Reading some notes for exam")

        self.assertEqual(len(data["categories"]), 2)
        cat_texts = [cat["text"] for cat in data["categories"]]
        self.assertIn("Study", cat_texts)
        self.assertIn("Work", cat_texts)

        self.assertEqual(
            set(data.keys()),
            {
                "id",
                "title",
                "description",
                "categories",
                "colour",
                "start_time",
                "deadline",
                "importance",
                "completed",
                "completed_minutes",
                "remaining_minutes",
                "locked",
                "allow_split",
                "min_split_minutes",
                "max_split_minutes",
                "buffer_before_minutes",
                "buffer_after_minutes",
                "estimated_minutes",
                "parent_task",
                "allocation",
                "total_task_allocations",
            },
        )

    def test_calendar_serializer_create_with_categories(self):
        """Test calendar serializer create with categories."""
        now = timezone.now()
        data = {
            "title": "New Task",
            "description": "New Desc",
            "estimated_minutes": 30,
            "start_time": now.isoformat(),
            "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
            "importance": 5,
            "completed": False,
            "completed_minutes": 10,
            "categories": [self.category1.id, self.category2.id],
            "allow_split": True,
            "min_split_minutes": 30,
            "max_split_minutes": 60,
            "buffer_before_minutes": 15,
            "buffer_after_minutes": 20,
        }

        serializer = CalendarSerializer(data=data, context=self._request_context())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        task = serializer.save(user=self.user)

        self.assertEqual(task.categories.count(), 2)
        self.assertIn(self.category1, task.categories.all())
        self.assertEqual(task.min_split_minutes, 30)
        self.assertEqual(task.max_split_minutes, 60)
        self.assertEqual(task.completed_minutes, 10)
        self.assertEqual(task.buffer_before_minutes, 15)
        self.assertEqual(task.buffer_after_minutes, 20)

    def test_calendar_serializer_rejects_max_split_below_minimum(self):
        """Test calendar serializer rejects max split below minimum."""
        now = timezone.now()
        serializer = CalendarSerializer(
            data={
                "title": "Invalid split settings",
                "description": "",
                "estimated_minutes": 30,
                "start_time": now.isoformat(),
                "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
                "importance": 5,
                "completed": False,
                "allow_split": True,
                "min_split_minutes": 60,
                "max_split_minutes": 30,
                "categories": [],
            },
            context=self._request_context(),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("max_split_minutes", serializer.errors)

    def test_calendar_serializer_marks_task_complete_when_completed_minutes_reaches_estimate(
        self,
    ):
        """Test calendar serializer marks task complete when completed minutes reaches estimate."""
        now = timezone.now()
        serializer = CalendarSerializer(
            data={
                "title": "Finished task",
                "description": "",
                "estimated_minutes": 45,
                "completed_minutes": 45,
                "start_time": now.isoformat(),
                "deadline": (now + datetime.timedelta(hours=2)).isoformat(),
                "importance": 5,
                "completed": False,
                "categories": [],
            },
            context=self._request_context(),
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        task = serializer.save(user=self.user)
        self.assertTrue(task.completed)
        self.assertEqual(task.remaining_minutes, 0)

    def test_calendar_serializer_rejects_completed_minutes_above_estimate(self):
        """Test calendar serializer rejects completed minutes above estimate."""
        now = timezone.now()
        serializer = CalendarSerializer(
            data={
                "title": "Too much progress",
                "description": "",
                "estimated_minutes": 30,
                "completed_minutes": 40,
                "start_time": now.isoformat(),
                "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
                "importance": 5,
                "completed": False,
                "categories": [],
            },
            context=self._request_context(),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("completed_minutes", serializer.errors)
