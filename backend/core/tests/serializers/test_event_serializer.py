import datetime
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from core.models import Event
from core.serializers.event import EventSerializer
from rest_framework.exceptions import ValidationError

class EventSerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )

    def test_serializer_validation_error(self):
        now = timezone.now()
        # End time before start time should trigger DjangoValidationError in clean()
        # which is then caught and re-raised as rest_framework.ValidationError
        data = {
            "title": "Invalid Event",
            "importance": 5,
            "start_time": now,
            "end_time": now - datetime.timedelta(hours=1),
        }
        serializer = EventSerializer(data=data, context={'request': type('obj', (object,), {'user': self.user})})
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        
        self.assertIn("end_time", context.exception.detail)
        self.assertEqual(context.exception.detail["end_time"][0], "End time must be after or equal to start time.")

    def test_serializer_create_without_reminders(self):
        now = timezone.now()
        data = {
            "title": "No Reminders",
            "importance": 5,
            "start_time": now,
            "end_time": now + datetime.timedelta(hours=1),
        }
        serializer = EventSerializer(data=data, context={'request': type('obj', (object,), {'user': self.user})})
        self.assertTrue(serializer.is_valid())
        event = serializer.save()
        self.assertEqual(event.title, "No Reminders")
        self.assertEqual(event.reminders.count(), 0)

    def test_serializer_update_reminders_none(self):
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Initial Title",
            importance=5,
            start_time=now,
            end_time=now + datetime.timedelta(hours=1)
        )
        data = {
            "title": "Updated Title",
        }
        # Partial update
        serializer = EventSerializer(instance=event, data=data, partial=True, context={'request': type('obj', (object,), {'user': self.user})})
        self.assertTrue(serializer.is_valid())
        updated_event = serializer.save()
        self.assertEqual(updated_event.title, "Updated Title")
