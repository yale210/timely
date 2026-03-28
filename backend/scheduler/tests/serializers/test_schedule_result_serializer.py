"""Tests for scheduler result serializer behavior."""

from django.test import TestCase

from scheduler.serializers import ScheduleResultSerializer


class ScheduleResultSerializerTests(TestCase):
    """Test result serialization for scheduled task output."""

    def test_get_segments_returns_none_when_missing(self):
        """Verify the serializer returns ``None`` when no segments exist."""

        class Instance:
            task_id = 1
            success = True
            scheduled_start = None
            scheduled_end = None
            reason = None

        obj = Instance()
        serializer = ScheduleResultSerializer(instance=obj)

        self.assertIsNone(serializer.get_segments(obj))

    def test_get_segments_returns_serialized_segment_list(self):
        """Verify the serializer preserves provided task segment boundaries."""

        class Instance:
            task_id = 1
            success = True
            scheduled_start = None
            scheduled_end = None
            reason = None
            segments = [("2026-03-19T10:00:00Z", "2026-03-19T11:00:00Z")]

        obj = Instance()
        serializer = ScheduleResultSerializer(instance=obj)

        segments = serializer.get_segments(obj)

        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0]["start"], "2026-03-19T10:00:00Z")
        self.assertEqual(segments[0]["end"], "2026-03-19T11:00:00Z")
