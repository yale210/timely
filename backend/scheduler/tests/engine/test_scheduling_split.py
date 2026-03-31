"""Tests for scheduler.engine.scheduling_split."""

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import make_aware

from core.models import Task
from scheduler.engine.scheduling import SchedulerSchedulingMixin


class FakeSchedulingScheduler(SchedulerSchedulingMixin):
    """Test double for split-scheduling helper coverage."""

    def __init__(self):
        self.allow_split = True
        self.min_block_minutes = 30
        self.tasks = []
        self._scheduled_blocks = []
        self._scheduled_task_segments = []
        self.available_days = set()
        self.slot_map = {}
        self.remaining_minutes = {}
        self.category_minutes = {}
        self.task_slot_overrides = {}

    @staticmethod
    def _aware(dt):
        return dt

    def _get_task_remaining_minutes(self, task):
        return self.remaining_minutes.get(task.id, task.remaining_minutes)

    def _iter_search_dates(self, start_date, deadline):
        current = start_date
        while current <= deadline.date():
            yield current
            current += timedelta(days=1)

    def _is_day_available(self, target_date):
        return target_date in self.available_days

    def _task_slots_for_date(
        self,
        task,
        current_date,
        min_minutes,
        task_start,
        deadline,
    ):
        return self.slot_map.get((task.id, current_date), [])

    def _shrink_slot_for_task(self, task, slot):
        return self.task_slot_overrides.get(task.id, slot)

    def _get_remaining_category_minutes(
        self,
        task,
        target_date,
        current_segments=None,
    ):
        return self.category_minutes.get((task.id, target_date))

    @staticmethod
    def _get_task_buffer_minutes(task):
        return task.buffer_before_minutes, task.buffer_after_minutes

    @staticmethod
    def _expand_task_segment(task, start, end):
        return start, end


class SchedulerSplitSchedulingTests(TestCase):
    """Test helper paths specific to split scheduling."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduler-split-user",
            password="password123",
            email="scheduler-split@example.com",
        )
        self.scheduler = FakeSchedulingScheduler()
        self.start_date = date(2026, 3, 20)

    def _task(self, title, *, allow_split=False, buffer_before=5, buffer_after=10):
        return Task.objects.create(
            user=self.user,
            title=title,
            description="",
            estimated_minutes=120,
            completed_minutes=0,
            start_time=make_aware(datetime.combine(self.start_date, time(9, 0))),
            deadline=make_aware(
                datetime.combine(self.start_date + timedelta(days=1), time(18, 0))
            ),
            importance=5,
            allow_split=allow_split,
            buffer_before_minutes=buffer_before,
            buffer_after_minutes=buffer_after,
        )

    def test_next_chunk_and_split_slot_cover_failure_and_success_paths(self):
        """Test next chunk and split slot cover failure and success paths."""
        slot = (
            make_aware(datetime.combine(self.start_date, time(9, 0))),
            make_aware(datetime.combine(self.start_date, time(10, 0))),
        )
        task = self._task(
            "Split helper",
            allow_split=True,
            buffer_before=0,
            buffer_after=0,
        )

        self.assertIsNone(
            self.scheduler._next_chunk_minutes(
                slot[0],
                slot[0] + timedelta(minutes=10),
                40,
                30,
                None,
                None,
            )
        )
        self.assertIsNone(
            self.scheduler._next_chunk_minutes(
                slot[0],
                slot[1],
                20,
                30,
                25,
                20,
            )
        )

        empty_segments = self.scheduler._split_slot(
            task,
            slot,
            60,
            (30, 60),
            20,
        )
        self.assertEqual(empty_segments[0], [])
        self.assertEqual(empty_segments[1], 60)

        segments, remaining, category_minutes = self.scheduler._split_slot(
            task,
            slot,
            60,
            (30, 30),
            60,
        )
        self.assertEqual(len(segments), 2)
        self.assertEqual(remaining, 0)
        self.assertEqual(category_minutes, 0)

    def test_schedule_task_split_covers_success_remainder_and_insufficient_category(
        self,
    ):
        """Test schedule task split covers success remainder and insufficient category."""
        task = self._task(
            "Split task",
            allow_split=True,
            buffer_before=0,
            buffer_after=0,
        )
        self.scheduler.remaining_minutes[task.id] = 60
        self.scheduler.available_days = {
            self.start_date,
            self.start_date + timedelta(days=1),
        }
        self.scheduler.slot_map[(task.id, self.start_date)] = [
            (
                make_aware(datetime.combine(self.start_date, time(9, 0))),
                make_aware(datetime.combine(self.start_date, time(10, 0))),
            )
        ]
        result = self.scheduler._schedule_task_split(task, self.start_date)
        self.assertTrue(result.success)
        self.assertEqual(len(result.segments), 1)

        self.scheduler.remaining_minutes[task.id] = 50
        self.scheduler.slot_map[(task.id, self.start_date)] = [
            (
                make_aware(datetime.combine(self.start_date, time(9, 0))),
                make_aware(datetime.combine(self.start_date, time(9, 20))),
            )
        ]
        remainder_result = self.scheduler._schedule_task_split(task, self.start_date)
        self.assertFalse(remainder_result.success)

        self.scheduler.category_minutes[(task.id, self.start_date)] = 10
        day_segments, day_remaining = self.scheduler._schedule_split_day(
            task,
            self.start_date,
            task.start_time,
            task.deadline,
            [],
            50,
            (30, None),
        )
        self.assertEqual(day_segments, [])
        self.assertEqual(day_remaining, 50)
