"""Tests for scheduler service behaviour."""

from datetime import date, datetime, time, timedelta
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from core.models import Task
from scheduler.services import Scheduler

from .scheduler_services_support import SchedulerServicesSupport


class SchedulerServiceAdvancedTests(SchedulerServicesSupport, TestCase):
    """Test cases for scheduler service advanced."""
    def test_schedule_split_skips_day_that_leaves_remainder_below_minimum(self):
        """Test schedule split skips day that leaves remainder below minimum."""
        day_one = date(2026, 3, 19)
        day_two = day_one + timedelta(days=1)

        Task.objects.create(
            user=self.user,
            title="Defer to next day",
            description="",
            estimated_minutes=120,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(day_two, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=20,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=2, allow_split=True, min_block_minutes=20
        )
        mocked_now = timezone.make_aware(datetime.combine(day_one, time(21, 48)))
        with (
            patch(
                "scheduler.engine.availability.timezone.localdate", return_value=day_one
            ),
            patch(
                "scheduler.engine.availability.timezone.now", return_value=mocked_now
            ),
        ):
            results = scheduler.schedule_tasks(start_date=day_one)

        self.assertTrue(results[0].success)
        self.assertEqual(results[0].scheduled_start.date(), day_two)

    def test_schedule_today_uses_minute_precision_boundaries(self):
        """Test schedule today uses minute precision boundaries."""
        today = date(2026, 3, 19)
        tomorrow = today + timedelta(days=1)

        Task.objects.create(
            user=self.user,
            title="Minute precision split task",
            description="",
            estimated_minutes=120,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(today, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(tomorrow, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=20,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=2, allow_split=True, min_block_minutes=20
        )
        mocked_now = timezone.make_aware(datetime.combine(today, time(21, 48, 37)))
        with (
            patch(
                "scheduler.engine.availability.timezone.localdate",
                return_value=today,
            ),
            patch(
                "scheduler.engine.availability.timezone.now",
                return_value=mocked_now,
            ),
        ):
            results = scheduler.schedule_tasks(start_date=today)

        self.assertTrue(results[0].success)
        for start, end in results[0].segments:
            self.assertEqual(start.second, 0)
            self.assertEqual(start.microsecond, 0)
            self.assertEqual(end.second, 0)
            self.assertEqual(end.microsecond, 0)

    def test_schedule_uses_only_remaining_minutes_after_partial_completion(self):
        """Test schedule uses only remaining minutes after partial completion."""
        start_day = date(2026, 3, 20)

        Task.objects.create(
            user=self.user,
            title="Partially done task",
            description="",
            estimated_minutes=120,
            completed_minutes=45,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertEqual(
            int(
                (results[0].scheduled_end - results[0].scheduled_start).total_seconds()
                // 60
            ),
            75,
        )

    def test_split_task_limits_prefer_task_over_scheduler_defaults(self):
        """Test split task limits prefer task over scheduler defaults."""
        task = Task.objects.create(
            user=self.user,
            title="Task-specific split limits",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=self.reference_dt,
            deadline=timezone.make_aware(datetime(2026, 2, 20, 12, 0)),
            completed=False,
            allow_split=True,
            min_split_minutes=15,
            max_split_minutes=45,
        )

        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=True)

        self.assertEqual(scheduler._split_task_limits(task), (15, 45))

    def test_build_split_result_returns_success_when_segments_cover_task(self):
        """Test build split result returns success when segments cover task."""
        task = Task.objects.create(
            user=self.user,
            title="Build split result",
            description="",
            estimated_minutes=60,
            importance=5,
            start_time=self.reference_dt,
            deadline=timezone.make_aware(datetime(2026, 2, 20, 12, 0)),
            completed=False,
            allow_split=True,
        )
        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=True)
        segments = [
            (
                timezone.make_aware(datetime(2026, 2, 12, 9, 0)),
                timezone.make_aware(datetime(2026, 2, 12, 9, 30)),
            ),
            (
                timezone.make_aware(datetime(2026, 2, 12, 10, 0)),
                timezone.make_aware(datetime(2026, 2, 12, 10, 30)),
            ),
        ]

        result = scheduler._build_split_result(task, segments, remaining=0)

        self.assertTrue(result.success)
        self.assertEqual(result.scheduled_start, segments[0][0])
        self.assertEqual(result.scheduled_end, segments[-1][1])
        self.assertEqual(result.segments, segments)
