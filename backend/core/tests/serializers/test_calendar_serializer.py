import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Category, Task
from core.serializers import CalendarSerializer


class CalendarSerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="serializeruser",
            password="password123",
        )

    def test_calendar_serializer_fields(self):
        today = timezone.now().date()
        category = Category.objects.create(text="Study")
        task = Task.objects.create(
            user=self.user,
            task_message="Read notes",
            task_category=category,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=2),
            importance=4,
        )

        data = CalendarSerializer(task).data

        self.assertEqual(data["task_category"], "Study")
        self.assertEqual(
            set(data.keys()),
            {
                "id",
                "task_message",
                "task_category",
                "start_time",
                "deadline",
                "importance",
                "completed",
            },
        )
