from datetime import date, datetime, time, timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.utils.timezone import make_aware

from core.models import Category, Preference, Task
from scheduler.engine.availability import SchedulerAvailabilityMixin
from scheduler.engine.categories import SchedulerCategoryMixin
from scheduler.engine.scheduling import SchedulerSchedulingMixin
from scheduler.scheduler_types import ScheduleResult


class FakeScheduler(SchedulerAvailabilityMixin, SchedulerCategoryMixin):
    def __init__(self, preference=None):
        self.preference = preference
        self.scheduled_tasks = []
        self._scheduled_task_segments = []
        self._scheduled_blocks = []
        self.commutes = []
        self.event_slots = []

    def _aware(self, dt):
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def _day_window(self, target_date):
        return (
            self._aware(datetime.combine(target_date, time(7, 0))),
            self._aware(datetime.combine(target_date, time(23, 0))),
        )

    def _working_window(self, target_date):
        return self._day_window(target_date)

    def _get_expanded_event_slots(self, target_date):
        return self.event_slots

    def _expand_task_segment(self, task, start, end):
        return (
            start - timedelta(minutes=task.buffer_before_minutes),
            end + timedelta(minutes=task.buffer_after_minutes),
        )

    @staticmethod
    def _ceil_to_minute(dt):
        if dt.second == 0 and dt.microsecond == 0:
            return dt
        return (dt + timedelta(minutes=1)).replace(second=0, microsecond=0)


class FakeSchedulingScheduler(SchedulerSchedulingMixin):
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


class SchedulerEngineMixinTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduler-mixin-user",
            password="password123",
            email="scheduler@example.com",
        )
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
            max_hours_study_per_day=2,
            limit_max_hours=True,
        )
        self.scheduler = FakeScheduler(preference=self.preference)
        self.target_date = date(2026, 3, 20)

    def _task(self, title, *, allocation=None, buffer_before=0, buffer_after=0):
        task = Task.objects.create(
            user=self.user,
            title=title,
            description="",
            estimated_minutes=120,
            completed_minutes=0,
            start_time=make_aware(datetime.combine(self.target_date, time(7, 0))),
            deadline=make_aware(datetime.combine(self.target_date, time(23, 0))),
            importance=5,
            allocation=allocation or [],
            total_task_allocations=len(allocation or []),
            buffer_before_minutes=buffer_before,
            buffer_after_minutes=buffer_after,
        )
        return task

    def test_category_helper_skips_invalid_segments_and_accumulates_usage(self):
        category = Category.objects.create(
            user=self.user,
            text="Study",
            max_daily_study_time=120,
        )
        task = self._task(
            "Task with invalid segments",
            allocation=[
                {"start": "not-an-iso-date", "end": "still-not-an-iso-date"},
                {
                    "start": make_aware(
                        datetime.combine(self.target_date, time(9, 0))
                    ).isoformat(),
                    "end": make_aware(
                        datetime.combine(self.target_date, time(10, 0))
                    ).isoformat(),
                },
            ],
        )
        task.categories.add(category)

        scheduled_task = self._task(
            "Scheduled",
            allocation=[
                {
                    "start": make_aware(
                        datetime.combine(self.target_date, time(8, 0))
                    ).isoformat(),
                    "end": make_aware(
                        datetime.combine(self.target_date, time(8, 30))
                    ).isoformat(),
                }
            ],
        )
        scheduled_task.categories.add(category)
        self.scheduler.scheduled_tasks = [scheduled_task]
        self.scheduler._scheduled_task_segments = [
            (
                scheduled_task,
                make_aware(datetime.combine(self.target_date, time(11, 0))),
                make_aware(datetime.combine(self.target_date, time(11, 30))),
            )
        ]

        minutes_used = self.scheduler._category_minutes_used(
            task,
            self.target_date,
            {category.id: 120},
            [
                (
                    make_aware(datetime.combine(self.target_date, time(12, 0))),
                    make_aware(datetime.combine(self.target_date, time(12, 15))),
                )
            ],
        )

        self.assertEqual(minutes_used[category.id], 75)
        self.assertEqual(len(self.scheduler._task_allocation_segments(task)), 1)

    def test_category_helpers_cover_overlap_and_no_limit_paths(self):
        uncapped_category = Category.objects.create(user=self.user, text="Uncapped")
        capped_category = Category.objects.create(
            user=self.user,
            text="Capped",
            max_daily_study_time=90,
        )
        task = self._task("Category task")
        task.categories.add(uncapped_category, capped_category)

        self.assertEqual(
            self.scheduler._category_limits(task),
            {capped_category.id: 90},
        )
        self.assertEqual(
            self.scheduler._task_category_ids(task),
            {uncapped_category.id, capped_category.id},
        )
        self.assertIsNone(
            self.scheduler._get_remaining_category_minutes(
                self._task("No limits"),
                self.target_date,
            )
        )

        minutes_used = {capped_category.id: 0}
        window = self.scheduler._day_window(self.target_date)
        self.scheduler._add_category_overlap(
            minutes_used,
            {capped_category.id},
            window[1] + timedelta(hours=1),
            window[1] + timedelta(hours=2),
            window,
        )
        self.assertEqual(minutes_used[capped_category.id], 0)

        self.scheduler._add_category_overlap(
            minutes_used,
            {capped_category.id},
            make_aware(datetime.combine(self.target_date, time(9, 0))),
            make_aware(datetime.combine(self.target_date, time(9, 30))),
            window,
        )
        self.assertEqual(minutes_used[capped_category.id], 30)

    def test_commute_slots_and_application_rules(self):
        matching_day = SimpleNamespace(day=5)
        non_matching_day = SimpleNamespace(day=2)
        matching_commute = SimpleNamespace(
            commute_start=time(8, 0),
            commute_end=time(8, 30),
            day_of_week=SimpleNamespace(all=lambda: [matching_day]),
        )
        non_matching_commute = SimpleNamespace(
            commute_start=time(9, 0),
            commute_end=time(9, 30),
            day_of_week=SimpleNamespace(all=lambda: [non_matching_day]),
        )
        always_commute = SimpleNamespace(
            commute_start=time(10, 0),
            commute_end=time(10, 15),
        )
        self.scheduler.commutes = [
            matching_commute,
            non_matching_commute,
            always_commute,
        ]

        occupied = self.scheduler._commute_slots(self.target_date)

        self.assertEqual(len(occupied), 2)
        self.assertTrue(
            self.scheduler._commute_applies(
                SimpleNamespace(
                    day_of_week=SimpleNamespace(all=lambda: [matching_day])
                ),
                self.target_date,
            )
        )
        self.assertTrue(
            self.scheduler._commute_applies(
                SimpleNamespace(day_of_week=None), self.target_date
            )
        )

    def test_get_available_slots_applies_trimming_blocks_and_capacity(self):
        self.scheduler.event_slots = [
            (
                make_aware(datetime.combine(self.target_date, time(9, 0))),
                make_aware(datetime.combine(self.target_date, time(10, 0))),
            )
        ]
        self.scheduler._scheduled_blocks = [
            (
                make_aware(datetime.combine(self.target_date, time(13, 0))),
                make_aware(datetime.combine(self.target_date, time(14, 0))),
            )
        ]
        buffered_task = self._task(
            "Buffered",
            allocation=[
                {
                    "start": make_aware(
                        datetime.combine(self.target_date, time(11, 0))
                    ).isoformat(),
                    "end": make_aware(
                        datetime.combine(self.target_date, time(11, 30))
                    ).isoformat(),
                }
            ],
            buffer_after=30,
        )
        self.scheduler.scheduled_tasks = [buffered_task]

        future_slots = self.scheduler.get_available_slots(
            self.target_date,
            15,
            not_before=make_aware(datetime.combine(self.target_date, time(8, 0))),
            not_after=make_aware(datetime.combine(self.target_date, time(15, 0))),
        )
        self.assertTrue(future_slots)

        self.preference.max_hours_study_per_day = 0
        self.preference.save(update_fields=["max_hours_study_per_day"])
        mocked_now = make_aware(datetime.combine(self.target_date, time(8, 14, 10)))
        with (
            patch(
                "scheduler.engine.availability.timezone.localdate",
                return_value=self.target_date,
            ),
            patch(
                "scheduler.engine.availability.timezone.now",
                return_value=mocked_now,
            ),
        ):
            slots = self.scheduler.get_available_slots(self.target_date, 15)
        self.assertEqual(slots, [])

    def test_apply_daily_capacity_can_be_disabled_and_counts_scheduled_segments(self):
        window = self.scheduler._day_window(self.target_date)
        task = self._task(
            "Scheduled task",
            allocation=[
                {
                    "start": make_aware(
                        datetime.combine(self.target_date, time(9, 0))
                    ).isoformat(),
                    "end": make_aware(
                        datetime.combine(self.target_date, time(9, 30))
                    ).isoformat(),
                }
            ],
        )
        self.scheduler.scheduled_tasks = [task]
        self.scheduler._scheduled_task_segments = [
            (
                task,
                make_aware(datetime.combine(self.target_date, time(10, 0))),
                make_aware(datetime.combine(self.target_date, time(10, 20))),
            )
        ]

        self.assertEqual(self.scheduler._scheduled_minutes_in_window(window), 50)

        self.preference.limit_max_hours = False
        self.preference.save(update_fields=["limit_max_hours"])
        free_slots = [(window[0], window[0] + timedelta(minutes=30))]

        self.assertEqual(
            self.scheduler._apply_daily_capacity(window, free_slots),
            free_slots,
        )


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
