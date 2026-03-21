from django.test import TestCase
from scheduler.serializers import ScheduleResultSerializer


class SerializersTests(TestCase):
    def test_schedule_result_serializer_get_segments_none(self):
        class MyInstance:
            task_id = 1
            success = True
            scheduled_start = None
            scheduled_end = None
            reason = None

        obj = MyInstance()
        serializer = ScheduleResultSerializer(instance=obj)
        self.assertIsNone(serializer.get_segments(obj))

    def test_schedule_result_serializer_get_segments_present(self):
        class MyInstance:
            task_id = 1
            success = True
            scheduled_start = None
            scheduled_end = None
            reason = None
            segments = [("2026-03-19T10:00:00Z", "2026-03-19T11:00:00Z")]

        obj = MyInstance()
        serializer = ScheduleResultSerializer(instance=obj)
        segments = serializer.get_segments(obj)
        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0]["start"], "2026-03-19T10:00:00Z")
