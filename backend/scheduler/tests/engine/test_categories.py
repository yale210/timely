"""Tests for scheduler.engine.categories."""

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.utils.timezone import make_aware

from core.models import Category, Preference, Task
from scheduler.engine.categories import SchedulerCategoryMixin


class FakeScheduler(SchedulerCategoryMixin):
    """Test double for the scheduler category mixin."""

    def __init__(self, preference=None):
        self.preference = preference
        self.scheduled_tasks = []
        self._scheduled_task_segments = []

    def _aware(self, dt):
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def _day_window(self, target_date):
        return (
            self._aware(datetime.combine(target_date, time(7, 0))),
            self._aware(datetime.combine(target_date, time(23, 0))),
        )


class SchedulerCategoryMixinTests(TestCase):
    """Test category limit and overlap calculations."""

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
