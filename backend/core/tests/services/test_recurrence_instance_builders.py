from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Event, EventOverride, EventReminder
from core.services.recurrence_instance_builders import (
    build_base_instance,
    build_override_instance,
)


class RecurrenceInstanceBuilderTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="builder-user",
            email="builder@example.com",
            password="password123",
        )
        self.start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.event = Event.objects.create(
            user=self.user,
            title="Seminar",
            description="Weekly seminar",
            location="Room A",
            start_time=self.start_time,
            end_time=self.start_time + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            colour="#123456",
        )

    def test_build_override_instance_uses_parent_reminder_fallback(self):
        EventReminder.objects.create(
            event=self.event,
            minutes_before=15,
            send_email=True,
            send_push=False,
        )
        override = EventOverride.objects.create(
            parent_event=self.event,
            original_start_time=self.start_time,
            start_time=self.start_time + timedelta(hours=2),
            end_time=self.start_time + timedelta(hours=3),
            title="Moved seminar",
            description="Updated",
            location="Room B",
            reminders_snapshot=[],
        )

        instance = build_override_instance(
            self.event,
            override,
            reminder_cache=[
                {
                    "id": 1,
                    "minutes_before": 15,
                    "send_email": True,
                    "send_push": False,
                }
            ],
        )

        self.assertTrue(instance.is_override)
        self.assertEqual(instance.start_time, override.start_time)
        self.assertEqual(instance.original_start_time, override.original_start_time)
        self.assertEqual(instance.colour, self.event.colour)
        self.assertEqual(instance.reminders[0]["minutes_before"], 15)

    def test_build_base_instance_uses_occurrence_anchor_for_recurring_event(self):
        occurrence_start = self.start_time + timedelta(weeks=1)

        instance = build_base_instance(
            self.event,
            categories=[],
            reminders=[],
            occurrence_start=occurrence_start,
            occurrence_end=occurrence_start + timedelta(hours=1),
        )

        self.assertFalse(instance.is_override)
        self.assertEqual(instance.start_time, occurrence_start)
        self.assertEqual(instance.original_start_time, occurrence_start)
        self.assertIn("base", instance.instance_id)
