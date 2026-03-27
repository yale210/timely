"""Tests for event scope update helpers."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Event, EventOverride
from core.services.event_scope_update_helpers import (
    build_following_child_payload,
    resolve_scope_this_fields,
)


class EventScopeUpdateHelperTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="helper-user",
            email="helper@example.com",
            password="password123",
        )
        self.base_start = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.event = Event.objects.create(
            user=self.user,
            title="Lecture",
            description="Original description",
            location="Hall 1",
            start_time=self.base_start,
            end_time=self.base_start + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(self.base_start + timedelta(days=7)).date(),
        )

    def test_resolve_scope_this_fields_uses_existing_override_defaults(self):
        original_start = self.base_start + timedelta(days=1)
        existing_override = EventOverride.objects.create(
            parent_event=self.event,
            original_start_time=original_start,
            title="Override title",
            description="Override description",
            location="Hall 2",
            start_time=original_start + timedelta(hours=2),
            end_time=original_start + timedelta(hours=3),
        )

        payload = resolve_scope_this_fields(
            self.event,
            existing_override,
            {},
            original_start,
        )

        self.assertEqual(payload.title, "Override title")
        self.assertEqual(payload.description, "Override description")
        self.assertEqual(payload.location, "Hall 2")
        self.assertEqual(payload.start_time, existing_override.start_time)
        self.assertEqual(payload.end_time, existing_override.end_time)

    def test_build_following_child_payload_uses_event_defaults_when_values_missing(
        self,
    ):
        child_start = self.base_start + timedelta(days=2)
        child_end = child_start + timedelta(hours=2)

        payload = build_following_child_payload(
            self.event,
            {},
            child_start,
            child_end,
            future_exception_dates=[child_start.date().isoformat()],
        )

        self.assertEqual(payload["title"], self.event.title)
        self.assertEqual(payload["description"], self.event.description)
        self.assertEqual(payload["location"], self.event.location)
        self.assertEqual(payload["start_time"], child_start)
        self.assertEqual(payload["end_time"], child_end)
        self.assertEqual(payload["recurrence_end"], self.event.recurrence_end)
        self.assertEqual(payload["exception_dates"], [child_start.date().isoformat()])
