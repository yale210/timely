"""Tests for event scope mutations."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Event, EventOverride
from core.services import apply_delete_scope, apply_update_scope, expand_event_instances


class EventScopeMutationServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scope-user",
            email="scope@example.com",
            password="password123",
        )
        self.base_start = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.event = Event.objects.create(
            user=self.user,
            title="Daily Lecture",
            start_time=self.base_start,
            end_time=self.base_start + timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(self.base_start + timedelta(days=10)).date(),
            exception_dates=[],
        )

    def test_scope_this_update_creates_override_and_exception(self):
        original_start = self.base_start + timedelta(days=2)
        apply_update_scope(
            self.event,
            {
                "title": "Daily Lecture (Edited)",
                "location": "Room 204",
                "start_time": original_start + timedelta(hours=2),
                "end_time": original_start + timedelta(hours=3),
                "reminders": [{"minutes_before": 20, "send_push": True}],
            },
            "this",
            original_start,
        )

        override = EventOverride.objects.get(
            parent_event=self.event,
            original_start_time=original_start,
        )
        self.assertEqual(override.title, "Daily Lecture (Edited)")
        self.assertIn(original_start.date().isoformat(), self.event.exception_dates)
        self.assertEqual(override.reminders_snapshot[0]["minutes_before"], 20)

    def test_scope_this_rejects_recurrence_pattern_change(self):
        original_start = self.base_start + timedelta(days=2)

        with self.assertRaises(ValueError):
            apply_update_scope(
                self.event,
                {"recurrence_interval": Event.RecurrenceInterval.WEEKLY},
                "this",
                original_start,
            )

    def test_scope_this_delete_marks_exception_and_removes_override(self):
        original_start = self.base_start + timedelta(days=1)
        EventOverride.objects.create(
            parent_event=self.event,
            title="Temp Override",
            description="",
            location="",
            start_time=original_start + timedelta(hours=1),
            end_time=original_start + timedelta(hours=2),
            original_start_time=original_start,
            reminders_snapshot=[],
        )

        apply_delete_scope(self.event, "this", original_start)

        self.assertFalse(
            EventOverride.objects.filter(
                parent_event=self.event,
                original_start_time=original_start,
            ).exists()
        )
        self.event.refresh_from_db()
        self.assertIn(original_start.date().isoformat(), self.event.exception_dates)

    def test_scope_this_update_noop_removes_existing_override(self):
        original_start = self.base_start + timedelta(days=2)
        EventOverride.objects.create(
            parent_event=self.event,
            title="Different",
            description="Changed",
            location="Room X",
            start_time=original_start + timedelta(hours=1),
            end_time=original_start + timedelta(hours=2),
            original_start_time=original_start,
            reminders_snapshot=[],
        )
        self.event.exception_dates = [original_start.date().isoformat()]
        self.event.save(update_fields=["exception_dates"])

        apply_update_scope(
            self.event,
            {
                "title": self.event.title,
                "description": self.event.description,
                "location": self.event.location,
                "start_time": original_start,
                "end_time": original_start + timedelta(hours=1),
            },
            "this",
            original_start,
        )

        self.assertFalse(
            EventOverride.objects.filter(
                parent_event=self.event,
                original_start_time=original_start,
            ).exists()
        )
        self.event.refresh_from_db()
        self.assertNotIn(original_start.date().isoformat(), self.event.exception_dates)

    def test_scope_following_update_splits_series_and_moves_future_data(self):
        split_anchor = self.base_start + timedelta(days=4)
        moved_override = EventOverride.objects.create(
            parent_event=self.event,
            title="Future Override",
            description="",
            location="",
            start_time=split_anchor + timedelta(hours=1),
            end_time=split_anchor + timedelta(hours=2),
            original_start_time=split_anchor,
            reminders_snapshot=[],
        )
        self.event.exception_dates = [
            (self.base_start + timedelta(days=1)).date().isoformat(),
            split_anchor.date().isoformat(),
        ]
        self.event.save(update_fields=["exception_dates"])

        child = apply_update_scope(
            self.event,
            {"title": "Updated Future Series"},
            "following",
            split_anchor,
        )

        self.event.refresh_from_db()
        moved_override.refresh_from_db()
        self.assertEqual(
            self.event.recurrence_end, split_anchor.date() - timedelta(days=1)
        )
        self.assertEqual(child.title, "Updated Future Series")
        self.assertEqual(child.split_from_event_id, self.event.id)
        self.assertEqual(moved_override.parent_event_id, child.id)
        self.assertIn(split_anchor.date().isoformat(), child.exception_dates)
        self.assertNotIn(split_anchor.date().isoformat(), self.event.exception_dates)

    def test_scope_following_delete_truncates_parent_and_cleans_future_data(self):
        anchor = self.base_start + timedelta(days=3)
        EventOverride.objects.create(
            parent_event=self.event,
            title="Future Override",
            description="",
            location="",
            start_time=anchor + timedelta(hours=1),
            end_time=anchor + timedelta(hours=2),
            original_start_time=anchor,
            reminders_snapshot=[],
        )
        self.event.exception_dates = [
            (self.base_start + timedelta(days=1)).date().isoformat(),
            anchor.date().isoformat(),
        ]
        self.event.save(update_fields=["exception_dates"])

        apply_delete_scope(self.event, "following", anchor)
        self.event.refresh_from_db()

        self.assertEqual(self.event.recurrence_end, anchor.date() - timedelta(days=1))
        self.assertFalse(
            EventOverride.objects.filter(
                parent_event=self.event,
                original_start_time__date__gte=anchor.date(),
            ).exists()
        )
        self.assertEqual(
            self.event.exception_dates,
            [(self.base_start + timedelta(days=1)).date().isoformat()],
        )

    def test_scope_all_update_detaches_non_aligned_override(self):
        original_start = self.base_start + timedelta(days=2)
        override = EventOverride.objects.create(
            parent_event=self.event,
            title="Detached Override",
            description="Detached",
            location="Room X",
            start_time=original_start + timedelta(hours=4),
            end_time=original_start + timedelta(hours=5),
            original_start_time=original_start,
            reminders_snapshot=[{"minutes_before": 5, "send_push": True}],
        )
        self.event.exception_dates = [original_start.date().isoformat()]
        self.event.save(update_fields=["exception_dates"])

        apply_update_scope(
            self.event,
            {"recurrence_interval": Event.RecurrenceInterval.WEEKLY},
            "all",
            None,
        )

        self.event.refresh_from_db()
        self.assertFalse(EventOverride.objects.filter(id=override.id).exists())
        detached_events = Event.objects.filter(
            user=self.user,
            recurrence_interval__isnull=True,
            start_time=override.start_time,
            title="Detached Override",
        )
        self.assertTrue(detached_events.exists())

    def test_scope_all_update_from_occurrence_payload_preserves_series_start(self):
        anchor = self.base_start + timedelta(days=3)

        apply_update_scope(
            self.event,
            {
                "title": "Renamed Series",
                "start_time": anchor,
                "end_time": anchor + timedelta(hours=1),
            },
            "all",
            anchor,
        )

        self.event.refresh_from_db()
        self.assertEqual(self.event.start_time, self.base_start)
        instances = expand_event_instances(
            self.event,
            self.base_start - timedelta(days=1),
            self.base_start + timedelta(days=3),
        )
        self.assertTrue(instances)
        self.assertEqual(instances[0].start_time.date(), self.base_start.date())

    def test_scope_all_update_without_anchor_keeps_existing_series_start(self):
        occurrence_payload_start = self.base_start + timedelta(days=5)

        apply_update_scope(
            self.event,
            {
                "title": "Renamed Series Without Anchor",
                "start_time": occurrence_payload_start,
                "end_time": occurrence_payload_start + timedelta(hours=1),
            },
            "all",
            None,
        )

        self.event.refresh_from_db()
        self.assertEqual(self.event.start_time.date(), self.base_start.date())

    def test_scope_following_from_moved_override_keeps_intermediate_occurrences(self):
        split_anchor = self.base_start + timedelta(days=2)
        moved_start = split_anchor + timedelta(days=2)

        apply_update_scope(
            self.event,
            {
                "title": "Moved Once",
                "start_time": moved_start,
                "end_time": moved_start + timedelta(hours=1),
            },
            "this",
            split_anchor,
        )

        child = apply_update_scope(
            self.event,
            {
                "title": "Future After Split",
                "start_time": moved_start,
                "end_time": moved_start + timedelta(hours=1),
            },
            "following",
            split_anchor,
        )

        self.event.refresh_from_db()
        self.assertEqual(
            self.event.recurrence_end,
            split_anchor.date() - timedelta(days=1),
        )
        self.assertEqual(child.start_time, split_anchor)
        child_instances = expand_event_instances(
            child,
            split_anchor,
            self.base_start + timedelta(days=6),
        )
        self.assertIn(
            (split_anchor + timedelta(days=1)).date(),
            [instance.start_time.date() for instance in child_instances],
        )

    def test_apply_update_scope_non_recurring(self):
        now = timezone.now().replace(microsecond=0)
        event = Event.objects.create(
            user=self.user, start_time=now, end_time=now + timedelta(hours=1)
        )
        apply_update_scope(event, {"title": "New Title"}, "all")
        event.refresh_from_db()
        self.assertEqual(event.title, "New Title")

    def test_apply_update_scope_validation_errors(self):
        with self.assertRaises(ValueError):
            apply_update_scope(self.event, {"title": "X"}, "this", None)
        with self.assertRaises(ValueError):
            apply_update_scope(self.event, {"title": "X"}, "following", None)

    def test_apply_delete_scope_validation_errors(self):
        with self.assertRaises(ValueError):
            apply_delete_scope(self.event, "this", None)
        with self.assertRaises(ValueError):
            apply_delete_scope(self.event, "following", None)
        # invalid scope defaults to delete event
        apply_delete_scope(self.event, "all", None)
        self.assertFalse(Event.objects.filter(id=self.event.id).exists())

    def test_revert_override_instance(self):
        from core.services.event_scope_mutations import revert_override_instance

        now = self.base_start
        EventOverride.objects.create(
            parent_event=self.event,
            original_start_time=now,
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=2),
            title="Override",
        )
        self.event.exception_dates = [now.date().isoformat()]
        self.event.save()

        revert_override_instance(self.event, now)
        self.assertFalse(self.event.overrides.filter(original_start_time=now).exists())
        self.event.refresh_from_db()
        self.assertNotIn(now.date().isoformat(), self.event.exception_dates)

        # Non-recurring event cannot revert
        event_nr = Event.objects.create(
            user=self.user, start_time=now, end_time=now + timedelta(hours=1)
        )
        with self.assertRaises(ValueError):
            revert_override_instance(event_nr, now)

        # No override exists
        with self.assertRaises(ValueError):
            revert_override_instance(self.event, now + timedelta(days=100))

    def test_normalise_reminders_none(self):
        from core.services.event_scope_mutations import _normalise_reminders

        self.assertEqual(_normalise_reminders(None), [])

    def test_split_exception_dates_invalid(self):
        from core.services.event_scope_mutations import _split_exception_dates
        from datetime import date

        past, future = _split_exception_dates(
            ["invalid-date", "2026-03-20"], date(2026, 3, 20)
        )
        self.assertEqual(past, [])
        self.assertEqual(future, ["2026-03-20"])

    def test_category_id_set_mixed(self):
        from core.services.event_scope_mutations import _category_id_set

        class MockObj:
            id = 123

        self.assertEqual(_category_id_set([MockObj(), 456]), {123, 456})

    def test_make_aware_already_aware(self):
        from core.services.event_scope_mutations import _make_aware

        now = timezone.now()
        self.assertEqual(_make_aware(now), now)

    def test_resolve_submitted_occurrence_window_edge_cases(self):
        from core.services.event_scope_mutations import (
            _resolve_submitted_occurrence_window,
        )

        now = self.base_start
        # No end_time, no start_time in data
        anchor, occ_start, sub_start, sub_end = _resolve_submitted_occurrence_window(
            self.event, {}, now
        )
        self.assertEqual(sub_start, occ_start)
        self.assertEqual(
            sub_end, occ_start + (self.event.end_time - self.event.start_time)
        )

        # start_time provided but no end_time
        new_start = now + timedelta(hours=5)
        anchor, occ_start, sub_start, sub_end = _resolve_submitted_occurrence_window(
            self.event, {"start_time": new_start}, now
        )
        self.assertEqual(sub_start, new_start)
        self.assertEqual(
            sub_end, new_start + (self.event.end_time - self.event.start_time)
        )

    def test_remove_exception_date_not_present(self):
        from core.services.event_scope_mutations import _remove_exception_date
        from datetime import date

        self.event.exception_dates = ["2026-03-19"]
        self.event.save()
        _remove_exception_date(self.event, date(2026, 3, 20))
        self.event.refresh_from_db()
        self.assertEqual(self.event.exception_dates, ["2026-03-19"])

    def test_detach_non_aligned_overrides_empty_exception_dates(self):
        from core.services.event_scope_mutations import _detach_non_aligned_overrides

        self.event.exception_dates = []
        self.event.save()
        _detach_non_aligned_overrides(self.event)  # Should not crash

    def test_scope_following_delete_past_cutoff(self):
        # Cutoff < start_time.date() -> delete event
        now = self.base_start
        apply_delete_scope(self.event, "following", now)
        self.assertFalse(Event.objects.filter(id=self.event.id).exists())

    def test_scope_following_update_past_cutoff(self):
        # Cutoff < start_time.date() -> delete event
        now = self.base_start
        child = apply_update_scope(self.event, {"title": "New Child"}, "following", now)
        self.assertFalse(Event.objects.filter(id=self.event.id).exists())
        self.assertEqual(child.title, "New Child")

    def test_make_aware_naive(self):
        from core.services.event_scope_mutations import _make_aware

        now = timezone.now()
        # Should become aware
        self.assertTrue(timezone.is_aware(_make_aware(now)))

    def test_replace_event_reminders_none(self):
        from core.services.event_scope_mutations import _replace_event_reminders

        # Should hit return if None
        _replace_event_reminders(self.event, None)

    def test_scope_following_update_with_categories_and_reminders(self):
        now = self.base_start
        from core.models import Category

        cat = Category.objects.create(user=self.user, text="X")
        child = apply_update_scope(
            self.event,
            {
                "title": "New Child",
                "categories": [cat.id],
                "reminders": [{"minutes_before": 30}],
            },
            "following",
            now + timedelta(days=2),
        )
        self.assertEqual(child.categories.count(), 1)
        self.assertEqual(child.reminders.count(), 1)
