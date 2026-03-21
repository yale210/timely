import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from core.models import Category, Task
from core.serializers import CalendarSerializer


class CalendarSerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="serializeruser", password="password123", email="test@user.com"
        )
        self.request_factory = APIRequestFactory()
        self.category1 = Category.objects.create(user=self.user, text="Study")
        self.category2 = Category.objects.create(user=self.user, text="Work")

    def _request_context(self):
        request = self.request_factory.post("/api/tasks/")
        request.user = self.user
        return {"request": request}

    def test_calendar_serializer_fields(self):
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

        # Check categories nested representation
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
                "locked",
                "allow_split",
                "min_split_minutes",
                "max_split_minutes",
                "estimated_minutes",  # I should check if this was in fields before, it wasn't but model has it.
                "parent_task",
                "allocation",
                "total_task_allocations",
            },
        )

    def test_calendar_serializer_create_with_categories(self):
        now = timezone.now()
        data = {
            "title": "New Task",
            "description": "New Desc",
            "estimated_minutes": 30,
            "start_time": now.isoformat(),
            "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
            "importance": 5,
            "completed": False,
            "categories": [self.category1.id, self.category2.id],
            "allow_split": True,
            "min_split_minutes": 30,
            "max_split_minutes": 60,
        }

        # To test creation, we usually use the serializer's save method
        # but we need a request context usually for user, or pass it explicitly
        serializer = CalendarSerializer(data=data, context=self._request_context())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        task = serializer.save(user=self.user)

        self.assertEqual(task.categories.count(), 2)
        self.assertIn(self.category1, task.categories.all())
        self.assertEqual(task.min_split_minutes, 30)
        self.assertEqual(task.max_split_minutes, 60)

    def test_calendar_serializer_rejects_max_split_below_minimum(self):
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
