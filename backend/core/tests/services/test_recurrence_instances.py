from datetime import timedelta
import datetime
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch

from core.models import Event, EventOverride
from core.services import expand_event_instances, expand_user_events
from core.services.recurrence_instances import (
    _make_aware,
    _normalise_reminder_snapshot,
    _get_event_rule_until,
    _build_event_rrule,
    _generate_occurrence_starts,
    is_occurrence_in_series,
)


class RecurrenceExpansionServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="recurrence-user",
            email="recurrence@example.com",
            password="password123",
        )

    def test_expand_event_instances_skips_exception_dates(self):
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
            event, now - timedelta(minutes=1), now + timedelta(days=2, hours=1)
        )
        self.assertEqual(len(instances), 2)
        self.assertNotIn(
            (now + timedelta(days=1)).date(), [i.start_time.date() for i in instances]
        )

    def test_make_aware_already_aware(self):
        now = timezone.now()
        self.assertEqual(_make_aware(now), now)

    def test_normalise_reminder_snapshot_invalid(self):
        bad_data = [
            {"minutes_before": "not-a-number", "send_email": True},
            {"minutes_before": 15, "send_email": True},
        ]
        result = _normalise_reminder_snapshot(bad_data)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["minutes_before"], 15)

    def test_get_event_rule_until_aware_mock(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(start_time=now, recurrence_end=(now + timedelta(days=5)).date())
        window_end = now + timedelta(days=10)
        aware_dt = timezone.make_aware(
            datetime.datetime.combine(event.recurrence_end, datetime.time.max)
        )
        with patch("core.services.recurrence_instances.datetime") as mock_datetime:
            mock_datetime.combine.return_value = aware_dt
            mock_datetime.time = datetime.time
            until = _get_event_rule_until(event, window_end)
            self.assertEqual(until, aware_dt)

    def test_build_event_rrule_none_interval(self):
        now = timezone.now()
        event = Event(start_time=now, recurrence_interval=None)
        self.assertIsNone(_build_event_rrule(event, now + timedelta(days=1)))

    def test_build_event_rrule_invalid_frequency(self):
        now = timezone.now()
        event = Event(start_time=now, recurrence_interval="INVALID")
        self.assertIsNone(_build_event_rrule(event, now + timedelta(days=1)))

    def test_generate_occurrence_starts_non_recurring_coverage(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(
            start_time=now, end_time=now + timedelta(hours=1), recurrence_interval=None
        )
        # Inside range
        self.assertEqual(
            len(
                _generate_occurrence_starts(
                    event, now - timedelta(hours=1), now + timedelta(hours=1)
                )
            ),
            1,
        )
        # Outside range (start_time > range_end)
        self.assertEqual(
            len(
                _generate_occurrence_starts(
                    event, now - timedelta(hours=2), now - timedelta(hours=1)
                )
            ),
            0,
        )

    def test_is_occurrence_in_series_non_recurring(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(start_time=now, recurrence_interval=None)
        self.assertTrue(is_occurrence_in_series(event, now))
        self.assertFalse(is_occurrence_in_series(event, now + timedelta(hours=1)))

    def test_is_occurrence_in_series_naive_conversion(self):
        now = timezone.now().replace(microsecond=0)
        now_naive = timezone.make_naive(now)
        event = Event(
            start_time=now, recurrence_interval=Event.RecurrenceInterval.DAILY
        )
        self.assertTrue(is_occurrence_in_series(event, now_naive))

    def test_expand_event_instances_with_overrides(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Base Event",
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
        )
        # Matches occurrence
        EventOverride.objects.create(
            parent_event=event,
            original_start_time=now,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=3),
            title="Override 1",
        )
        # Standalone (not matching occurrence in window)
        EventOverride.objects.create(
            parent_event=event,
            original_start_time=now + timedelta(days=10),
            start_time=now + timedelta(hours=5),
            end_time=now + timedelta(hours=6),
            title="Override 2",
        )
        instances = expand_event_instances(
            event, now - timedelta(hours=1), now + timedelta(hours=10)
        )
        titles = [i.title for i in instances]
        self.assertIn("Override 1", titles)
        self.assertIn("Override 2", titles)
        self.assertNotIn("Base Event", titles)  # anchor was 'now', which was overridden

    def test_expand_user_events_empty(self):
        now = timezone.now()
        other_user = get_user_model().objects.create_user(
            username="other-rec", email="other@rec.com", password="password123"
        )
        Event.objects.create(
            user=other_user, start_time=now, end_time=now + timedelta(hours=1)
        )
        instances = expand_user_events(self.user, now, now + timedelta(days=1))
        self.assertEqual(len(instances), 0)

    def test_non_recurring_event_fully_before_range_excluded(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Past",
            start_time=now - timedelta(hours=3),
            end_time=now - timedelta(hours=2),
        )
        instances = expand_event_instances(event, now, now + timedelta(hours=1))
        self.assertEqual(len(instances), 0)

    def test_recurrence_end_limit(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Ending soon",
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=now.date(),
        )
        # Should only have 1 instance (today)
        instances = expand_event_instances(event, now, now + timedelta(days=2))
        self.assertEqual(len(instances), 1)

    def test_build_event_rrule_until_before_start(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(
            start_time=now,
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(now - timedelta(days=1)).date(),
        )
        self.assertIsNone(_build_event_rrule(event, now + timedelta(days=1)))

    def test_expand_event_instances_reminders_snapshot_empty(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user,
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
        )
        EventOverride.objects.create(
            parent_event=event,
            original_start_time=now,
            start_time=now,
            end_time=now + timedelta(hours=1),
            reminders_snapshot=[],
        )
        instances = expand_event_instances(
            event, now - timedelta(minutes=1), now + timedelta(hours=1)
        )
        self.assertEqual(len(instances), 1)
        self.assertTrue(instances[0].is_override)

    def test_expand_user_events_sorted(self):
        now = timezone.now().replace(microsecond=0)
        Event.objects.create(
            user=self.user,
            title="Later",
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=3),
        )
        Event.objects.create(
            user=self.user,
            title="Earlier",
            start_time=now,
            end_time=now + timedelta(hours=1),
        )
        instances = expand_user_events(
            self.user, now - timedelta(hours=1), now + timedelta(hours=5)
        )
        self.assertEqual(instances[0].title, "Earlier")
        self.assertEqual(instances[1].title, "Later")

    def test_generate_occurrence_starts_future_event(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(
            start_time=now + timedelta(days=10),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
        )
        starts = _generate_occurrence_starts(event, now, now + timedelta(days=1))
        self.assertEqual(len(starts), 0)

    def test_generate_occurrence_starts_rule_none_recurring(self):
        now = timezone.now().replace(microsecond=0)
        # Event that ends before it starts but has recurrence interval
        event = Event(
            start_time=now,
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(now - timedelta(days=1)).date(),
        )
        starts = _generate_occurrence_starts(event, now, now + timedelta(days=1))
        self.assertEqual(len(starts), 0)

    def test_is_occurrence_in_series_before_start(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(
            start_time=now, recurrence_interval=Event.RecurrenceInterval.DAILY
        )
        self.assertFalse(is_occurrence_in_series(event, now - timedelta(days=1)))

    def test_is_occurrence_in_series_after_end(self):
        now = timezone.now().replace(microsecond=0)
        event = Event(
            start_time=now,
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=now.date(),
        )
        self.assertFalse(is_occurrence_in_series(event, now + timedelta(days=1)))

    def test_is_occurrence_in_series_rule_none(self):
        now = timezone.now().replace(microsecond=0)
        # recurrence_interval is set but invalid
        event = Event(start_time=now, recurrence_interval="GARBAGE")
        self.assertFalse(is_occurrence_in_series(event, now))

    def test_expand_event_instances_override_outside_range(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="Base",
            start_time=now,
            end_time=now + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
        )
        # Override at 'now' that moves the occurrence to 'now + 10 days'
        EventOverride.objects.create(
            parent_event=event,
            original_start_time=now,
            start_time=now + timedelta(days=10),
            end_time=now + timedelta(days=10, hours=1),
            title="Far Away Override",
        )
        # Range is only today
        instances = expand_event_instances(
            event, now - timedelta(hours=1), now + timedelta(hours=2)
        )
        # 'now' should be skipped because it has an override, but the override is outside the range
        titles = [i.title for i in instances]
        self.assertNotIn("Base", titles)
        self.assertNotIn("Far Away Override", titles)

    def test_expand_event_instances_non_recurring_spanning_start(self):
        now = timezone.now().replace(microsecond=0)
        # Starts before range, ends in range
        event = Event.objects.create(
            user=self.user,
            title="Spanning",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=1),
        )
        # Range starts at 'now'
        instances = expand_event_instances(event, now, now + timedelta(hours=5))
        self.assertEqual(len(instances), 1)
        self.assertEqual(instances[0].title, "Spanning")

    def test_expand_event_instances_standalone_override_outside_range(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user, start_time=now, end_time=now + timedelta(hours=1)
        )
        # Override for a future date not in series (though it's not a series here)
        EventOverride.objects.create(
            parent_event=event,
            original_start_time=now + timedelta(days=5),
            start_time=now + timedelta(days=5),
            end_time=now + timedelta(days=5, hours=1),
            title="Future Override",
        )
        # Range is only today
        instances = expand_event_instances(event, now, now + timedelta(hours=2))
        titles = [i.title for i in instances]
        self.assertNotIn("Future Override", titles)

    def test_expand_event_instances_override_no_reminders_uses_parent(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user, start_time=now, end_time=now + timedelta(hours=1)
        )
        # No reminders on parent either, but testing the 'or' logic
        EventOverride.objects.create(
            parent_event=event,
            original_start_time=now,
            start_time=now,
            end_time=now + timedelta(hours=1),
            reminders_snapshot=[],
        )
        instances = expand_event_instances(event, now, now + timedelta(hours=1))
        self.assertEqual(len(instances), 1)
        self.assertEqual(instances[0].reminders, [])

    def test_expand_event_instances_occurrence_outside_range_branch_coverage(self):
        # We need an occurrence_start that is generated by _generate_occurrence_starts
        # but is NOT in the range and NOT spanning it (for non-recurring).
        # We'll mock _generate_occurrence_starts to return such a value.
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user,
            title="B1",
            start_time=now,
            end_time=now + timedelta(hours=1),
        )

        with patch(
            "core.services.recurrence_instances._generate_occurrence_starts"
        ) as mock_gen:
            # Return an occurrence start that is way after the range end
            mock_gen.return_value = [now + timedelta(days=100)]
            instances = expand_event_instances(event, now, now + timedelta(hours=1))
            self.assertEqual(len(instances), 0)
