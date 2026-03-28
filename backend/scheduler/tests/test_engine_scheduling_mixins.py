"""Tests for scheduler engine mixin behaviour."""

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import make_aware

from core.models import Task

from .scheduler_engine_mixins_support import FakeSchedulingScheduler


class SchedulerSchedulingMixinTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduler-scheduling-user",
            password="password123",
            email="scheduler-scheduling@example.com",
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

    def test_clip_helpers_cover_boundary_cases(self):
        slot = (
            make_aware(datetime.combine(self.start_date, time(9, 0))),
            make_aware(datetime.combine(self.start_date, time(11, 0))),
        )
        deadline = make_aware(datetime.combine(self.start_date, time(10, 0)))
        task_start = make_aware(datetime.combine(self.start_date, time(10, 30)))

        self.assertEqual(
            self.scheduler._clip_to_deadline(slot, deadline), (slot[0], deadline)
        )
        self.assertIsNone(self.scheduler._clip_to_deadline(slot, slot[0]))
        self.assertEqual(
            self.scheduler._clip_to_task_start(slot, task_start), (task_start, slot[1])
        )
        self.assertIsNone(self.scheduler._clip_to_task_start(slot, slot[1]))
        self.assertEqual(
            self.scheduler._task_search_start(task_start, self.start_date),
            task_start.date(),
        )
        self.assertIsNone(self.scheduler._clip_slot(None, task_start, deadline))

    def test_next_chunk_and_split_slot_cover_failure_and_success_paths(self):
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

    def test_schedule_task_no_split_covers_success_empty_and_failure_paths(self):
        task = self._task("No split task")
        self.scheduler.remaining_minutes[task.id] = 0
        empty_result = self.scheduler._schedule_task_no_split(task, self.start_date)
        self.assertTrue(empty_result.success)
        self.assertEqual(empty_result.segments, [])

        self.scheduler.remaining_minutes[task.id] = 60
        self.scheduler.available_days = {self.start_date}
        self.scheduler.slot_map[(task.id, self.start_date)] = [
            (
                make_aware(datetime.combine(self.start_date, time(8, 0))),
                make_aware(datetime.combine(self.start_date, time(12, 0))),
            )
        ]
        success_result = self.scheduler._schedule_task_no_split(task, self.start_date)
        self.assertTrue(success_result.success)
        self.assertEqual(success_result.scheduled_start.time(), time(9, 0))

        self.scheduler.task_slot_overrides[task.id] = None
        failure_result = self.scheduler._schedule_task_no_split(task, self.start_date)
        self.assertFalse(failure_result.success)

    def test_schedule_task_split_covers_success_remainder_and_insufficient_category(
        self,
    ):
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

    def test_schedule_tasks_store_results_and_route_split_or_no_split(self):
        split_task = self._task("Split task routed", allow_split=True)
        no_split_task = self._task("No split routed", allow_split=False)
        no_split_task.importance = 9
        no_split_task.save(update_fields=["importance"])
        self.scheduler.tasks = [split_task, no_split_task]

        self.scheduler._schedule_task_split = lambda task, start_date: ScheduleResult(
            task_id=task.id,
            success=True,
            scheduled_start=task.start_time,
            scheduled_end=task.start_time + timedelta(minutes=30),
            segments=[(task.start_time, task.start_time + timedelta(minutes=30))],
        )
        self.scheduler._schedule_task_no_split = lambda task, start_date: (
            ScheduleResult(
                task_id=task.id,
                success=True,
                scheduled_start=task.start_time,
                scheduled_end=task.start_time + timedelta(minutes=45),
                segments=[],
            )
        )

        results = self.scheduler.schedule_tasks(self.start_date)

        self.assertEqual(
            [result.task_id for result in results], [no_split_task.id, split_task.id]
        )
        self.assertEqual(len(self.scheduler._scheduled_blocks), 2)
        self.assertEqual(len(self.scheduler._scheduled_task_segments), 2)

        past_deadline_task = self._task("Past deadline", allow_split=False)
        past_deadline_task.deadline = make_aware(
            datetime.combine(self.start_date - timedelta(days=1), time(18, 0))
        )
        self.assertFalse(
            self.scheduler._schedule_task(
                past_deadline_task,
                self.start_date,
            ).success
        )
        self.assertFalse(
            self.scheduler._should_store_result(
                ScheduleResult(task_id=1, success=False)
            )
        )
