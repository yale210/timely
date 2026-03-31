"""Tests for scheduler engine mixin behaviour."""

from datetime import date, datetime, time, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import make_aware

from core.models import Category, Preference, Task

from .scheduler_engine_mixins_support import FakeScheduler


class SchedulerEngineMixinTests(TestCase):
    """Test cases for scheduler engine mixin."""

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
        """Test category helper skips invalid segments and accumulates usage."""
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
        """Test category helpers cover overlap and no limit paths."""
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

    def test_get_occupied_slots_combines_events_tasks_and_manual_blocks(self):
        """Test get occupied slots combines events tasks and manual blocks."""
        self.scheduler.event_slots = [
            (
                make_aware(datetime.combine(self.target_date, time(8, 0))),
                make_aware(datetime.combine(self.target_date, time(8, 30))),
            )
        ]
        task = self._task(
            "Occupied task",
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
        self.scheduler._scheduled_blocks = [
            (
                make_aware(datetime.combine(self.target_date, time(10, 0))),
                make_aware(datetime.combine(self.target_date, time(10, 30))),
            )
        ]

        occupied = self.scheduler._get_occupied_slots(self.target_date)

        self.assertEqual(len(occupied), 3)

    def test_get_available_slots_applies_trimming_blocks_and_capacity(self):
        """Test get available slots applies trimming blocks and capacity."""
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
        """Test apply daily capacity can be disabled and counts scheduled segments."""
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
