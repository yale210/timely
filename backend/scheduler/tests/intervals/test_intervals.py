from datetime import datetime

from django.test import SimpleTestCase
from django.utils import timezone

from scheduler.intervals import (
    clamp_slots,
    filter_slots_by_minutes,
    subtract_intervals,
    trim_slots_to_minutes,
)


class IntervalHelpersTest(SimpleTestCase):
    """Test cases for interval helpers."""

    def setUp(self):
        self.start = timezone.make_aware(datetime(2026, 3, 23, 8, 0))
        self.mid = timezone.make_aware(datetime(2026, 3, 23, 9, 0))
        self.end = timezone.make_aware(datetime(2026, 3, 23, 10, 0))

    def test_clamp_slots_applies_bounds(self):
        """Test clamp slots applies bounds."""
        slots = [(self.start, self.end)]
        clamped = clamp_slots(slots, not_before=self.mid)
        self.assertEqual(clamped, [(self.mid, self.end)])

    def test_subtract_intervals_returns_free_ranges(self):
        """Test subtract intervals returns free ranges."""
        free_slots = subtract_intervals(
            (self.start, self.end),
            [(self.mid, self.end)],
        )
        self.assertEqual(free_slots, [(self.start, self.mid)])

    def test_trim_slots_to_minutes_stops_at_requested_length(self):
        """Test trim slots to minutes stops at requested length."""
        trimmed = trim_slots_to_minutes([(self.start, self.end)], 30)
        expected_end = timezone.make_aware(datetime(2026, 3, 23, 8, 30))
        self.assertEqual(trimmed, [(self.start, expected_end)])

    def test_filter_slots_by_minutes_removes_short_ranges(self):
        """Test filter slots by minutes removes short ranges."""
        slots = [
            (self.start, self.mid),
            (self.mid, timezone.make_aware(datetime(2026, 3, 23, 9, 15))),
        ]
        filtered = filter_slots_by_minutes(slots, 30)
        self.assertEqual(filtered, [(self.start, self.mid)])
