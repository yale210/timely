from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Event, EventOverride
from core.services import expand_event_instances, expand_user_events


class RecurrenceExpansionServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="recurrence-user",
            email="recurrence@example.com",
            password="password123",
        )

    def test_expand_event_instances_skips_exception_dates_without_override(self):
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Study Session",
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(now + timedelta(days=2)).date(),
            exception_dates=[(now + timedelta(days=1)).date().isoformat()],
        )

        instances = expand_event_instances(
            event,
            now - timedelta(minutes=1),
            now + timedelta(days=2, hours=1),
        )

        self.assertEqual(len(instances), 2)
        self.assertFalse(any(instance.is_override for instance in instances))
        self.assertNotIn(
            (now + timedelta(days=1)).date(),
            [instance.start_time.date() for instance in instances],
        )

    def test_expand_event_instances_substitutes_override_before_exception_skip(self):
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        original_start = now + timedelta(days=1)
        event = Event.objects.create(
            user=self.user,
            title="Weekly Lab",
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(now + timedelta(days=2)).date(),
            exception_dates=[original_start.date().isoformat()],
        )
        override = EventOverride.objects.create(
            parent_event=event,
            title="Weekly Lab (Moved)",
            description="Room changed",
            location="Building B",
            start_time=original_start + timedelta(hours=2),
            end_time=original_start + timedelta(hours=3),
            original_start_time=original_start,
            reminders_snapshot=[{"minutes_before": 10, "send_push": True}],
        )

        instances = expand_event_instances(
            event,
            now - timedelta(minutes=1),
            now + timedelta(days=2, hours=2),
        )

        override_instances = [
            instance for instance in instances if instance.is_override
        ]
        self.assertEqual(len(override_instances), 1)
        self.assertEqual(override_instances[0].title, override.title)
        self.assertEqual(override_instances[0].original_start_time, original_start)

    def test_expand_event_instances_includes_moved_override_with_out_of_range_anchor(
        self,
    ):
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Morning Workout",
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(now + timedelta(days=10)).date(),
        )

        original_start_time = now + timedelta(days=8)
        moved_start_time = now + timedelta(days=1, hours=3)
        EventOverride.objects.create(
            parent_event=event,
            title="Workout (Moved)",
            description="Rescheduled",
            location="Gym B",
            start_time=moved_start_time,
            end_time=moved_start_time + timedelta(hours=1),
            original_start_time=original_start_time,
            reminders_snapshot=[],
        )

        instances = expand_event_instances(
            event,
            now,
            now + timedelta(days=3),
        )

        moved_instances = [
            instance
            for instance in instances
            if instance.is_override
            and instance.original_start_time == original_start_time
        ]
        self.assertEqual(len(moved_instances), 1)
        self.assertEqual(moved_instances[0].start_time, moved_start_time)

    def test_expand_user_events_returns_sorted_flattened_instances(self):
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        Event.objects.create(
            user=self.user,
            title="Later Event",
            start_time=now + timedelta(hours=5),
            end_time=now + timedelta(hours=6),
        )
        Event.objects.create(
            user=self.user,
            title="Earlier Event",
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=2),
        )

        instances = expand_user_events(
            self.user,
            now,
            now + timedelta(days=1),
        )

        self.assertGreaterEqual(len(instances), 2)
        self.assertEqual(
            [instance.title for instance in instances[:2]],
            ["Earlier Event", "Later Event"],
        )

    def test_non_recurring_event_overlapping_window_start_is_included(self):
        """Non-recurring event that starts before range_start but ends within the window."""
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Long Meeting",
            start_time=now - timedelta(hours=2),
            end_time=now + timedelta(hours=1),
        )

        instances = expand_event_instances(
            event,
            now,
            now + timedelta(days=1),
        )

        self.assertEqual(len(instances), 1)
        self.assertEqual(instances[0].title, "Long Meeting")

    def test_non_recurring_event_fully_before_window_is_excluded(self):
        """Non-recurring event that ends before range_start is excluded."""
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Past Meeting",
            start_time=now - timedelta(hours=3),
            end_time=now - timedelta(hours=1),
        )

        instances = expand_event_instances(
            event,
            now,
            now + timedelta(days=1),
        )

        self.assertEqual(len(instances), 0)

    def test_expand_user_events_includes_overlapping_non_recurring_event(self):
        """expand_user_events includes non-recurring events starting before the window."""
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        Event.objects.create(
            user=self.user,
            title="Spanning Event",
            start_time=now - timedelta(hours=2),
            end_time=now + timedelta(hours=1),
        )

        instances = expand_user_events(
            self.user,
            now,
            now + timedelta(days=1),
        )

        titles = [instance.title for instance in instances]
        self.assertIn("Spanning Event", titles)
