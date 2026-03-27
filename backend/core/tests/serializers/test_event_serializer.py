"""Tests for event serializer."""

import datetime
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from core.models import Event
from core.serializers.event import EventSerializer
from rest_framework.exceptions import ValidationError


class EventSerializerTests(TestCase):
    """Test cases for event serializer."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )

    def test_serializer_validation_error(self):
        """Test serializer validation error."""
        now = timezone.now()
        # End time before start time should trigger DjangoValidationError in clean()
        # which is then caught and re-raised as rest_framework.ValidationError
        data = {
            "title": "Invalid Event",
            "start_time": now,
            "end_time": now - datetime.timedelta(hours=1),
        }
        serializer = EventSerializer(
            data=data, context={"request": type("obj", (object,), {"user": self.user})}
        )
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)

        self.assertIn("end_time", context.exception.detail)
        self.assertEqual(
            context.exception.detail["end_time"][0],
            "End time must be after or equal to start time.",
        )

    def test_serializer_create_without_reminders(self):
        """Test serializer create without reminders."""
        now = timezone.now()
        data = {
            "title": "No Reminders",
            "start_time": now,
            "end_time": now + datetime.timedelta(hours=1),
        }
        serializer = EventSerializer(
            data=data, context={"request": type("obj", (object,), {"user": self.user})}
        )
        self.assertTrue(serializer.is_valid())
        event = serializer.save()
        self.assertEqual(event.title, "No Reminders")
        self.assertEqual(event.reminders.count(), 0)

    def test_serializer_update_reminders_none(self):
        """Test serializer update reminders none."""
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Initial Title",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        data = {
            "title": "Updated Title",
        }
        # Partial update
        serializer = EventSerializer(
            instance=event,
            data=data,
            partial=True,
            context={"request": type("obj", (object,), {"user": self.user})},
        )
        self.assertTrue(serializer.is_valid())
        updated_event = serializer.save()
        self.assertEqual(updated_event.title, "Updated Title")

    def test_serializer_create_without_categories(self):
        """Test serializer create without categories."""
        now = timezone.now()
        data = {
            "title": "No Categories Event",
            "start_time": now,
            "end_time": now + datetime.timedelta(hours=1),
        }
        serializer = EventSerializer(
            data=data, context={"request": type("obj", (object,), {"user": self.user})}
        )
        self.assertTrue(serializer.is_valid())
        event = serializer.save()
        self.assertEqual(event.title, "No Categories Event")
        self.assertEqual(event.categories.count(), 0)

    def test_serializer_update_categories(self):
        """Test serializer update categories."""
        from core.models import Category

        now = timezone.now()
        category = Category.objects.create(text="Work")
        event = Event.objects.create(
            user=self.user,
            title="Initial Title",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
        )
        data = {
            "title": "Updated Title",
            "categories": [category.id],
        }
        serializer = EventSerializer(
            instance=event,
            data=data,
            partial=True,
            context={"request": type("obj", (object,), {"user": self.user})},
        )
        self.assertTrue(serializer.is_valid())
        updated_event = serializer.save()
        self.assertEqual(updated_event.categories.count(), 1)
        self.assertEqual(updated_event.categories.first(), category)

    def test_serializer_create_with_categories(self):
        """Test serializer create with categories."""
        from core.models import Category

        now = timezone.now()
        category = Category.objects.create(text="Meeting")
        data = {
            "title": "Event with Categories",
            "start_time": now,
            "end_time": now + datetime.timedelta(hours=1),
            "categories": [category.id],
        }
        serializer = EventSerializer(
            data=data, context={"request": type("obj", (object,), {"user": self.user})}
        )
        self.assertTrue(serializer.is_valid())
        event = serializer.save()
        self.assertEqual(event.categories.count(), 1)
        self.assertEqual(event.categories.first(), category)

    def test_serializer_partial_update_reminders_validates_against_existing_start_time(
        self,
    ):
        """Test serializer partial update reminders validates against existing start time."""
        now = timezone.now()
        event = Event.objects.create(
            user=self.user,
            title="Existing Event",
            start_time=now + datetime.timedelta(minutes=5),
            end_time=now + datetime.timedelta(hours=1),
        )
        data = {
            "reminders": [
                {"send_push": True, "send_email": False, "minutes_before": 10},
            ]
        }
        serializer = EventSerializer(
            instance=event,
            data=data,
            partial=True,
            context={"request": type("obj", (object,), {"user": self.user})},
        )

        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)

        self.assertIn("reminders", context.exception.detail)

    def test_partial_validate_does_not_mutate_instance_fields(self):
        """Test partial validate does not mutate instance fields."""
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Recurring Event",
            start_time=now,
            end_time=now + datetime.timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(now + datetime.timedelta(days=10)).date(),
        )

        occurrence_start = now + datetime.timedelta(days=3)
        serializer = EventSerializer(
            instance=event,
            data={
                "title": "Updated Title",
                "start_time": occurrence_start,
                "end_time": occurrence_start + datetime.timedelta(hours=1),
                "recurrence_interval": Event.RecurrenceInterval.DAILY,
                "recurrence_end": event.recurrence_end,
            },
            partial=True,
            context={"request": type("obj", (object,), {"user": self.user})},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        event.refresh_from_db()
        self.assertEqual(event.start_time, now)
