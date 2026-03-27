from datetime import date, datetime, time, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import (
    Category,
    Commute,
    DayOfWeek,
    Event,
    Preference,
    SpecialDates,
    Task,
)
from scheduler.services import Scheduler


class SchedulerTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password",
        )
        self.reference_dt = timezone.make_aware(datetime(2026, 2, 12, 9, 0))
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
        )

    def test_get_preference(self):
        scheduler = Scheduler(self.user)
        self.assertEqual(scheduler._get_preference(), self.preference)

    def test_get_unscheduled_tasks(self):
        task1 = Task.objects.create(
            user=self.user,
            title="Important Report",
            description="Write the monthly report",
            estimated_minutes=120,
            importance=3,
            start_time=timezone.now() + timedelta(hours=1),
            deadline=timezone.make_aware(datetime(2026, 2, 20, 17, 0)),
            completed=False,
        )
        Task.objects.create(
            user=self.user,
            title="Grocery Shopping",
            description="Buy groceries for the week",
            estimated_minutes=60,
            importance=1,
            start_time=timezone.now() + timedelta(hours=1),
            deadline=timezone.make_aware(datetime(2026, 2, 18, 12, 0)),
            completed=False,
        )

        scheduler = Scheduler(self.user)
        tasks = scheduler._get_unscheduled_tasks()
        self.assertEqual(len(tasks), 2)
        self.assertEqual(tasks[0], task1)  # higher importance first

    def test_get_events(self):
        event1 = Event.objects.create(
            user=self.user,
            title="Team Meeting",
            start_time=timezone.make_aware(datetime(2026, 2, 13, 10, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 13, 11, 0)),
        )
        Event.objects.create(
            user=self.user,
            title="Doctor's Appointment",
            start_time=timezone.make_aware(datetime(2026, 2, 14, 14, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 14, 15, 0)),
        )

        scheduler = Scheduler(self.user)
        events = scheduler._get_events()
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0], event1)

    def test_get_commutes(self):
        Commute.objects.create(
            user=self.user,
            commute_start=time(8, 30),
            commute_end=time(9, 0),
        )
        Commute.objects.create(
            user=self.user,
            commute_start=time(17, 0),
            commute_end=time(17, 30),
        )

        scheduler = Scheduler(self.user)
        commutes = scheduler._get_commutes()
        self.assertEqual(len(commutes), 2)

    def test_is_day_available_with_days_off_and_special_dates(self):
        target_date = date(2026, 2, 12)  # Thursday
        scheduler = Scheduler(self.user)
        self.assertTrue(scheduler._is_day_available(target_date))

        thursday = DayOfWeek.objects.get_or_create(day=4)[0]
        self.preference.days_off.add(thursday)
        scheduler = Scheduler(self.user)
        self.assertFalse(scheduler._is_day_available(target_date))

        self.preference.days_off.clear()
        SpecialDates.objects.create(user=self.user, date=target_date, text="Holiday")
        scheduler = Scheduler(self.user)
        self.assertFalse(scheduler._is_day_available(target_date))

    def test_schedule_single_task_no_split(self):
        Task.objects.create(
            user=self.user,
            title="Write summary",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=self.reference_dt,
            deadline=timezone.make_aware(datetime(2026, 2, 20, 12, 0)),
            completed=False,
        )
        scheduler = Scheduler(self.user, max_days_ahead=3, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIsNotNone(results[0].scheduled_start)
        self.assertEqual(results[0].scheduled_start.date(), date(2026, 2, 12))

    def test_schedule_task_split_across_days(self):
        base_day = timezone.localdate() + timedelta(days=1)
        # Leave only 60 mins on day 1; rest on day 2
        Event.objects.create(
            user=self.user,
            title="Long event",
            start_time=timezone.make_aware(datetime.combine(base_day, time(8, 0))),
            end_time=timezone.make_aware(datetime.combine(base_day, time(22, 0))),
        )
        Task.objects.create(
            user=self.user,
            title="Large task",
            description="",
            estimated_minutes=120,
            importance=8,
            start_time=timezone.make_aware(datetime.combine(base_day, time(7, 0))),
            deadline=timezone.make_aware(
                datetime.combine(base_day + timedelta(days=2), time(18, 0))
            ),
            completed=False,
        )
        scheduler = Scheduler(
            self.user, max_days_ahead=3, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=base_day)

        self.assertTrue(results[0].success)
        self.assertGreater(results[0].scheduled_end, results[0].scheduled_start)

    def test_schedule_respects_deadline(self):
        Task.objects.create(
            user=self.user,
            title="Overdue",
            description="",
            estimated_minutes=30,
            importance=1,
            start_time=self.reference_dt,
            deadline=timezone.make_aware(datetime(2026, 2, 10, 10, 0)),
            completed=False,
        )
        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertFalse(results[0].success)
        self.assertIn("Deadline", results[0].reason)

    def test_schedule_includes_deadline_day_within_horizon(self):
        start_date = date(2026, 3, 19)
        deadline_dt = timezone.make_aware(datetime(2026, 3, 26, 10, 0))
        mocked_now = timezone.make_aware(datetime(2026, 3, 19, 6, 0))

        for offset in range(7):
            blocked_day = start_date + timedelta(days=offset)
            Event.objects.create(
                user=self.user,
                title=f"Block {blocked_day.isoformat()}",
                start_time=timezone.make_aware(
                    datetime.combine(blocked_day, time(7, 0))
                ),
                end_time=timezone.make_aware(
                    datetime.combine(blocked_day, time(23, 0))
                ),
            )

        Task.objects.create(
            user=self.user,
            title="Boundary deadline task",
            description="",
            estimated_minutes=59,
            importance=5,
            start_time=timezone.make_aware(datetime(2026, 3, 19, 13, 0)),
            deadline=deadline_dt,
            completed=False,
            allow_split=True,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=7, allow_split=True, min_block_minutes=30
        )
        mocked_now = timezone.make_aware(datetime.combine(start_date, time(0, 0)))
        with patch(
            "scheduler.engine.availability.timezone.localdate", return_value=start_date
        ), patch(
            "scheduler.engine.availability.timezone.now", return_value=mocked_now
        ):
            results = scheduler.schedule_tasks(start_date=start_date)

        self.assertTrue(results[0].success)
        self.assertEqual(results[0].scheduled_start.date(), deadline_dt.date())

    def test_schedule_does_not_place_task_before_task_start_time(self):
        task = Task.objects.create(
            user=self.user,
            title="Afternoon task",
            description="",
            estimated_minutes=60,
            importance=5,
            start_time=timezone.make_aware(datetime(2026, 3, 19, 13, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 19, 18, 0)),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 3, 19))

        self.assertTrue(results[0].success)
        self.assertGreaterEqual(results[0].scheduled_start, task.start_time)

    def test_schedule_task_split_uses_task_min_split_minutes(self):
        day_one = timezone.localdate() + timedelta(days=1)

        Task.objects.create(
            user=self.user,
            title="Small block split task",
            description="",
            estimated_minutes=30,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(day_one, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=15,
            max_split_minutes=15,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=2, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=day_one)

        self.assertTrue(results[0].success)
        self.assertEqual(len(results[0].segments), 2)
        self.assertEqual(
            [
                int((end - start).total_seconds() // 60)
                for start, end in results[0].segments
            ],
            [15, 15],
        )

    def test_schedule_task_split_respects_task_max_split_minutes(self):
        start_day = date(2026, 3, 19)

        Task.objects.create(
            user=self.user,
            title="Max block split task",
            description="",
            estimated_minutes=150,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=30,
            max_split_minutes=60,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=1, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertEqual(len(results[0].segments), 3)
        self.assertEqual(
            [
                int((end - start).total_seconds() // 60)
                for start, end in results[0].segments
            ],
            [60, 60, 30],
        )

    def test_schedule_task_split_does_not_create_block_below_task_minimum(self):
        day_one = date(2026, 3, 19)
        day_two = day_one + timedelta(days=1)

        Event.objects.create(
            user=self.user,
            title="Block day one",
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 30))),
            end_time=timezone.make_aware(datetime.combine(day_one, time(23, 0))),
        )
        Event.objects.create(
            user=self.user,
            title="Block day two",
            start_time=timezone.make_aware(datetime.combine(day_two, time(7, 40))),
            end_time=timezone.make_aware(datetime.combine(day_two, time(23, 0))),
        )

        Task.objects.create(
            user=self.user,
            title="Too small final split block",
            description="",
            estimated_minutes=50,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(day_one, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(day_two, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=30,
        )

        scheduler = Scheduler(
            self.user, max_days_ahead=2, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=day_one)

        self.assertFalse(results[0].success)
        self.assertEqual(results[0].segments, [])

    def test_schedule_respects_category_daily_limit(self):
        start_day = date(2026, 3, 19)
        category = Category.objects.create(
            user=self.user,
            text="Study",
            max_daily_study_time=60,
        )

        Task.objects.create(
            user=self.user,
            title="Capped category task",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
            allow_split=True,
            min_split_minutes=30,
        ).categories.add(category)

        scheduler = Scheduler(
            self.user, max_days_ahead=1, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertFalse(results[0].success)
        self.assertEqual(results[0].segments, [])

    def test_schedule_respects_task_buffer_before_event(self):
        start_day = date(2026, 3, 19)
        Event.objects.create(
            user=self.user,
            title="Blocking event",
            start_time=timezone.make_aware(datetime.combine(start_day, time(10, 0))),
            end_time=timezone.make_aware(datetime.combine(start_day, time(10, 45))),
        )
        Task.objects.create(
            user=self.user,
            title="Buffered task",
            description="",
            estimated_minutes=30,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(10, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(12, 0))),
            completed=False,
            buffer_before_minutes=30,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertGreaterEqual(
            results[0].scheduled_start,
            timezone.make_aware(datetime.combine(start_day, time(11, 15))),
        )

    def test_schedule_respects_existing_task_buffers(self):
        start_day = date(2026, 3, 19)
        Task.objects.create(
            user=self.user,
            title="Already scheduled buffered task",
            description="",
            estimated_minutes=30,
            importance=8,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(12, 0))),
            completed=False,
            buffer_after_minutes=30,
            allocation=[
                {
                    "start": timezone.make_aware(
                        datetime.combine(start_day, time(8, 0))
                    ).isoformat(),
                    "end": timezone.make_aware(
                        datetime.combine(start_day, time(8, 30))
                    ).isoformat(),
                }
            ],
            total_task_allocations=1,
        )
        Task.objects.create(
            user=self.user,
            title="Follow-up task",
            description="",
            estimated_minutes=30,
            importance=4,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(12, 0))),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertGreaterEqual(
            results[0].scheduled_start,
            timezone.make_aware(datetime.combine(start_day, time(9, 0))),
        )

    def test_schedule_respects_recurring_event_instances(self):
        start_day = timezone.localdate() + timedelta(days=1)
        Event.objects.create(
            user=self.user,
            title="Recurring block",
            start_time=timezone.make_aware(datetime.combine(start_day, time(10, 0))),
            end_time=timezone.make_aware(datetime.combine(start_day, time(11, 0))),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
        )
        Task.objects.create(
            user=self.user,
            title="Task around recurring event",
            description="",
            estimated_minutes=90,
            importance=5,
            start_time=timezone.make_aware(datetime.combine(start_day, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(start_day, time(23, 0))),
            completed=False,
        )

        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=start_day)

        self.assertTrue(results[0].success)
        self.assertLessEqual(
            results[0].scheduled_end,
            timezone.make_aware(datetime.combine(start_day, time(10, 0))),
        )

    def test_schedule_split_skips_day_that_leaves_remainder_below_minimum(self):
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
        with patch(
            "scheduler.engine.availability.timezone.localdate", return_value=day_one
        ), patch(
            "scheduler.engine.availability.timezone.now", return_value=mocked_now
        ):
            results = scheduler.schedule_tasks(start_date=day_one)

        self.assertTrue(results[0].success)
        self.assertEqual(results[0].scheduled_start.date(), day_two)

    def test_schedule_today_uses_minute_precision_boundaries(self):
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
        with patch(
            "scheduler.engine.availability.timezone.localdate",
            return_value=today,
        ), patch(
            "scheduler.engine.availability.timezone.now",
            return_value=mocked_now,
        ):
            results = scheduler.schedule_tasks(start_date=today)

        self.assertTrue(results[0].success)
        for start, end in results[0].segments:
            self.assertEqual(start.second, 0)
            self.assertEqual(start.microsecond, 0)
            self.assertEqual(end.second, 0)
            self.assertEqual(end.microsecond, 0)

    def test_schedule_uses_only_remaining_minutes_after_partial_completion(self):
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
