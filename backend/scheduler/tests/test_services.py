from unittest.mock import patch, MagicMock
from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Commute, DayOfWeek, Event, Preference, SpecialDates, Task
from scheduler.services import Scheduler
from scheduler.scheduler_types import ScheduleResult


class SchedulerTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password",
        )
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
            day_schedule=[
                {"day": i, "start": "07:00", "end": "23:00"} for i in range(1, 8)
            ],
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
            start_time=timezone.now(),
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
        # Leave only 60 mins on day 1; rest on day 2
        Event.objects.create(
            user=self.user,
            title="Long event",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 8, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 22, 0)),
        )
        Task.objects.create(
            user=self.user,
            title="Large task",
            description="",
            estimated_minutes=120,
            importance=8,
            start_time=timezone.now(),
            deadline=timezone.make_aware(datetime(2026, 2, 14, 18, 0)),
            completed=False,
        )
        scheduler = Scheduler(
            self.user, max_days_ahead=3, allow_split=True, min_block_minutes=30
        )
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertTrue(results[0].success)
        self.assertGreater(results[0].scheduled_end, results[0].scheduled_start)

    def test_schedule_respects_deadline(self):
        Task.objects.create(
            user=self.user,
            title="Overdue",
            description="",
            estimated_minutes=30,
            importance=1,
            start_time=timezone.now(),
            deadline=timezone.make_aware(datetime(2026, 2, 10, 10, 0)),
            completed=False,
        )
        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))

        self.assertFalse(results[0].success)
        self.assertIn("Deadline", results[0].reason)

    def test_aware_helper(self):
        scheduler = Scheduler(self.user)
        naive = datetime(2023, 1, 1, 10, 0)
        aware = scheduler._aware(naive)
        self.assertTrue(timezone.is_aware(aware))
        self.assertEqual(scheduler._aware(aware), aware)

    def test_merge_intervals(self):
        scheduler = Scheduler(self.user)
        intervals = [
            (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 12, 0)),
            (datetime(2023, 1, 1, 11, 0), datetime(2023, 1, 1, 13, 0)),
            (datetime(2023, 1, 1, 14, 0), datetime(2023, 1, 1, 15, 0)),
        ]
        merged = scheduler._merge_intervals(intervals)
        self.assertEqual(len(merged), 2)
        self.assertEqual(merged[0], (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 13, 0)))
        self.assertEqual(merged[1], (datetime(2023, 1, 1, 14, 0), datetime(2023, 1, 1, 15, 0)))

    def test_subtract_intervals(self):
        scheduler = Scheduler(self.user)
        window = (datetime(2023, 1, 1, 9, 0), datetime(2023, 1, 1, 17, 0))
        occupied = [
            (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 12, 0)),
            (datetime(2023, 1, 1, 14, 0), datetime(2023, 1, 1, 15, 0)),
        ]
        free = scheduler._subtract_intervals(window, occupied)
        self.assertEqual(len(free), 3)
        self.assertEqual(free[0], (datetime(2023, 1, 1, 9, 0), datetime(2023, 1, 1, 10, 0)))
        self.assertEqual(free[1], (datetime(2023, 1, 1, 12, 0), datetime(2023, 1, 1, 14, 0)))
        self.assertEqual(free[2], (datetime(2023, 1, 1, 15, 0), datetime(2023, 1, 1, 17, 0)))

        # Occupied overlaps window edges
        occupied = [(datetime(2023, 1, 1, 8, 0), datetime(2023, 1, 1, 10, 0))]
        free = scheduler._subtract_intervals(window, occupied)
        self.assertEqual(len(free), 1)
        self.assertEqual(free[0], (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 17, 0)))

        occupied = [(datetime(2023, 1, 1, 16, 0), datetime(2023, 1, 1, 18, 0))]
        free = scheduler._subtract_intervals(window, occupied)
        self.assertEqual(len(free), 1)
        self.assertEqual(free[0], (datetime(2023, 1, 1, 9, 0), datetime(2023, 1, 1, 16, 0)))

    def test_get_available_slots_max_hours(self):
        self.preference.limit_max_hours = True
        self.preference.max_hours_study_per_day = 1
        self.preference.save()
        
        target_date = date(2026, 2, 12)
        # 30 mins already scheduled in a task
        Task.objects.create(
            user=self.user, title="S1", estimated_minutes=30,
            start_time=timezone.now(),
            deadline=timezone.now() + timedelta(days=1),
            importance=1,
            allocation=[{"start": "2026-02-12T08:00:00Z", "end": "2026-02-12T08:30:00Z"}]
        )
        scheduler = Scheduler(self.user)
        # Should have 30 mins remaining (since max is 1h)
        slots = scheduler.get_available_slots(target_date, min_minutes=10)
        total_available = sum((e - s).total_seconds() / 60 for s, e in slots)
        self.assertEqual(total_available, 30)

    def test_clip_to_deadline(self):
        scheduler = Scheduler(self.user)
        deadline = datetime(2023, 1, 1, 12, 0)
        
        # Slot ends before deadline
        slot = (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 11, 0))
        self.assertEqual(scheduler._clip_to_deadline(slot, deadline), slot)
        
        # Slot starts after deadline
        slot = (datetime(2023, 1, 1, 13, 0), datetime(2023, 1, 1, 14, 0))
        self.assertIsNone(scheduler._clip_to_deadline(slot, deadline))
        
        # Slot overlaps deadline
        slot = (datetime(2023, 1, 1, 11, 0), datetime(2023, 1, 1, 13, 0))
        self.assertEqual(scheduler._clip_to_deadline(slot, deadline), (datetime(2023, 1, 1, 11, 0), deadline))

    def test_schedule_task_split_insufficient_time(self):
        # Occupy most of the day
        Event.objects.create(
            user=self.user, title="Busy",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 7, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 22, 30))
        )
        # Only 30 mins left (22:30 to 23:00)
        Task.objects.create(
            user=self.user, title="Too Big", estimated_minutes=60,
            start_time=timezone.now(),
            importance=1,
            allow_split=True,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=True, min_block_minutes=10)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertFalse(results[0].success)
        self.assertEqual(results[0].reason, "Insufficient time within horizon")

    def test_get_unscheduled_tasks_locked(self):
        Task.objects.create(
            user=self.user, title="Locked", estimated_minutes=30,
            start_time=timezone.now(), deadline=timezone.now() + timedelta(days=1),
            importance=1, locked=True
        )
        scheduler = Scheduler(self.user)
        tasks = scheduler._get_unscheduled_tasks()
        # Should NOT include locked task
        self.assertNotIn("Locked", [t.title for t in tasks])

    def test_working_window_crosses_midnight(self):
        self.preference.day_start = time(22, 0)
        self.preference.day_end = time(6, 0)
        self.preference.save()
        
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user)
        with patch.object(Preference, "get_day_window", return_value=(time(22, 0), time(6, 0))):
            start, end = scheduler._working_window(target_date)
            self.assertEqual(start.time(), time(22, 0))
            self.assertEqual(end.time(), time(6, 0))
            self.assertEqual(end.date(), target_date + timedelta(days=1))

    def test_occupied_slots_commute_with_days(self):
        target_date = date(2026, 2, 12) # Thursday
        thu_day = DayOfWeek.objects.get_or_create(day=4)[0] # DayOfWeek.Day.THURSDAY is 4
        
        # Use a mock commute because the model is missing day_of_week
        mock_commute = MagicMock()
        mock_commute.commute_start = time(8, 0)
        mock_commute.commute_end = time(9, 0)
        
        mock_day_of_week = MagicMock()
        mock_day_of_week.all.return_value = [thu_day]
        mock_commute.day_of_week = mock_day_of_week
        
        with patch.object(Scheduler, "_get_commutes", return_value=[mock_commute]):
            scheduler = Scheduler(self.user)
            occupied = scheduler._get_occupied_slots(target_date)
            # 2026-02-12 is Thursday, weekday()+1 = 4. thu_day.day = 4. Should match.
            self.assertTrue(any(s.time() == time(8, 0) for s, e in occupied))
            
            # Another date (Friday)
            friday_date = date(2026, 2, 13)
            occupied_fri = scheduler._get_occupied_slots(friday_date)
            self.assertFalse(any(s.time() == time(8, 0) for s, e in occupied_fri))

    def test_get_occupied_slots_malformed_allocation(self):
        Task.objects.create(
            user=self.user, title="Malformed", estimated_minutes=30,
            start_time=timezone.now(), deadline=timezone.now() + timedelta(days=1),
            importance=1,
            allocation=[{"start": "invalid"}] # missing 'end' and invalid format
        )
        scheduler = Scheduler(self.user)
        # Should not crash
        occupied = scheduler._get_occupied_slots(date(2026, 2, 12))
        self.assertEqual(len(occupied), 0)

    def test_get_available_slots_today(self):
        # When target_date is today, it should clip to 'now'
        today = timezone.localdate()
        scheduler = Scheduler(self.user)
        with patch("django.utils.timezone.now") as mock_now:
            # Set 'now' to 10:00 AM today
            mock_now.return_value = timezone.make_aware(datetime.combine(today, time(10, 0)))
            slots = scheduler.get_available_slots(today, min_minutes=1)
            for s, e in slots:
                self.assertGreaterEqual(s, mock_now.return_value)

    def test_get_preference_none(self):
        self.user.preference.delete()
        from django.contrib.auth import get_user_model
        # Reload user from DB to clear cached preference
        user = get_user_model().objects.get(id=self.user.id)
        scheduler = Scheduler(user)
        self.assertIsNone(scheduler._get_preference())

    def test_get_available_slots_no_limit(self):
        # Even if max_hours is set, if limit_max_hours is False, it should not trim
        self.preference.limit_max_hours = False
        self.preference.max_hours_study_per_day = 1
        self.preference.save()
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user)
        slots = scheduler.get_available_slots(target_date, min_minutes=1)
        # default_day_schedule is 08:00 to 22:00 = 14 hours
        # Actually window is 07:00 to 23:00 = 16 hours
        total_available = sum((e - s).total_seconds() / 3600 for s, e in slots)
        self.assertEqual(total_available, 16)

    def test_occupied_slots_overlap_scheduled_blocks(self):
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user)
        # Manually add to _scheduled_blocks
        start = timezone.make_aware(datetime.combine(target_date, time(10, 0)))
        end = timezone.make_aware(datetime.combine(target_date, time(11, 0)))
        scheduler._scheduled_blocks.append((start, end))
        
        occupied = scheduler._get_occupied_slots(target_date)
        self.assertTrue(any(s == start and e == end for s, e in occupied))

    def test_schedule_task_split_complex(self):
        # Window: 07:00 - 23:00
        # Event: 09:00 - 10:00 (occupies 1 hour)
        Event.objects.create(
            user=self.user, title="B1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 9, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 10, 0))
        )
        # Task 120 min task, split allowed, min block 30
        Task.objects.create(
            user=self.user, title="SplitTask", estimated_minutes=120,
            start_time=timezone.now(), importance=10, allow_split=True,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=True, min_block_minutes=30)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        
        self.assertTrue(results[0].success)
        # Should have 2 segments: 07-09 (120m) - wait, 07 to 09 is 120m!
        # So it might fit in one segment.
        # Let's make the event start earlier.
        Event.objects.all().delete()
        Event.objects.create(
            user=self.user, title="B1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 8, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 9, 0))
        )
        # Free: 07:00-08:00 (60m), 09:00-23:00 (14h)
        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=True, min_block_minutes=30)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertTrue(results[0].success)
        self.assertEqual(len(results[0].segments), 2)

    def test_get_special_dates(self):
        target_date = date(2026, 2, 12)
        SpecialDates.objects.create(user=self.user, date=target_date, text="Holiday")
        scheduler = Scheduler(self.user)
        self.assertIn(target_date, scheduler.special_dates)

    def test_subtract_intervals_coverage(self):
        scheduler = Scheduler(self.user)
        window = (
            timezone.make_aware(datetime(2026, 2, 12, 10, 0)),
            timezone.make_aware(datetime(2026, 2, 12, 12, 0))
        )
        # occupied entirely before window
        occupied = [
            (timezone.make_aware(datetime(2026, 2, 12, 8, 0)), timezone.make_aware(datetime(2026, 2, 12, 9, 0))),
            # occupied entirely after window
            (timezone.make_aware(datetime(2026, 2, 12, 13, 0)), timezone.make_aware(datetime(2026, 2, 12, 14, 0)))
        ]
        free = scheduler._subtract_intervals(window, occupied)
        self.assertEqual(len(free), 1)
        self.assertEqual(free[0], window)

    def test_get_occupied_slots_invalid_allocation(self):
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=30,
            start_time=timezone.now(), deadline=timezone.now() + timedelta(days=1),
            importance=5,
            allocation=[{"start": "invalid"}] # Missing "end", invalid format
        )
        scheduler = Scheduler(self.user)
        # Should not crash
        occupied = scheduler._get_occupied_slots(date(2026, 2, 12))
        self.assertEqual(len(occupied), 0)

    def test_get_occupied_slots_commute_no_all(self):
        # We'll mock the commute's day_of_week to not have 'all'
        mock_commute = MagicMock()
        mock_commute.commute_start = time(9, 0)
        mock_commute.commute_end = time(10, 0)
        # day_attr is not None but does NOT have .all()
        mock_commute.day_of_week = "not-a-manager"
        
        with patch.object(Scheduler, "_get_commutes", return_value=[mock_commute]):
             scheduler = Scheduler(self.user)
             occupied = scheduler._get_occupied_slots(date(2026, 2, 12))
             # Should still be applies_today=True by default if no day_attr or no .all()
             self.assertEqual(len(occupied), 1)

    def test_working_window_no_preference(self):
        self.user.preference.delete()
        # Re-fetch user to clear cached preference
        from django.contrib.auth import get_user_model
        user = get_user_model().objects.get(id=self.user.id)
        scheduler = Scheduler(user)
        start, end = scheduler._working_window(date(2026, 2, 12))
        self.assertEqual(start.time(), time.min)
        self.assertEqual(end.time(), time.max)

    def test_get_available_slots_today_past_window_start(self):
        target_date = timezone.localdate()
        # Mock timezone.now to be after window_start (07:00)
        now = timezone.make_aware(datetime.combine(target_date, time(10, 0)))
        with patch('django.utils.timezone.now', return_value=now):
            scheduler = Scheduler(self.user)
            slots = scheduler.get_available_slots(target_date, min_minutes=1)
            # Window should start at 10:00
            self.assertEqual(slots[0][0], now)

    def test_get_available_slots_no_limit_max_hours(self):
        self.preference.limit_max_hours = False
        self.preference.save()
        scheduler = Scheduler(self.user)
        # Should not enter the trimming logic
        slots = scheduler.get_available_slots(date(2026, 2, 12), min_minutes=1)
        self.assertEqual(len(slots), 1)

    def test_get_available_slots_remaining_minutes_zero(self):
        self.preference.limit_max_hours = True
        self.preference.max_hours_study_per_day = 1 # 60 mins
        self.preference.save()
        # Occupy 60 mins with a scheduled task.
        Task.objects.create(
            user=self.user, title="T1", estimated_minutes=60,
            start_time=timezone.make_aware(datetime(2026, 2, 12, 8, 0)),
            deadline=timezone.make_aware(datetime(2026, 2, 12, 20, 0)),
            importance=5,
            allocation=[{"start": "2026-02-12T08:00:00Z", "end": "2026-02-12T09:00:00Z"}]
        )
        scheduler = Scheduler(self.user)
        slots = scheduler.get_available_slots(date(2026, 2, 12), min_minutes=1)
        self.assertEqual(len(slots), 0)

    def test_schedule_task_no_split_deadline_past(self):
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=30,
            start_time=timezone.now(), importance=5,
            deadline=timezone.make_aware(datetime(2026, 2, 11, 23, 59))
        )
        scheduler = Scheduler(self.user)
        result = scheduler._schedule_task_no_split(task, date(2026, 2, 12))
        self.assertFalse(result.success)

    def test_schedule_task_no_split_day_unavailable(self):
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=30,
            start_time=timezone.now(), importance=5,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        target_date = date(2026, 2, 12)
        SpecialDates.objects.create(user=self.user, date=target_date)
        scheduler = Scheduler(self.user)
        result = scheduler._schedule_task_no_split(task, target_date)
        self.assertFalse(result.success)

    def test_schedule_task_no_split_not_capped(self):
        # This happens if slot starts after deadline
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=30,
            start_time=timezone.now(), importance=5,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 6, 0)) # before window starts at 07:00
        )
        scheduler = Scheduler(self.user)
        result = scheduler._schedule_task_no_split(task, date(2026, 2, 12))
        self.assertFalse(result.success)

    def test_schedule_task_split_deadline_past(self):
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=30, allow_split=True,
            start_time=timezone.now(), importance=5,
            deadline=timezone.make_aware(datetime(2026, 2, 11, 23, 59))
        )
        scheduler = Scheduler(self.user)
        result = scheduler._schedule_task_split(task, date(2026, 2, 12))
        self.assertFalse(result.success)

    def test_schedule_task_split_day_unavailable(self):
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=30, allow_split=True,
            start_time=timezone.now(), importance=5,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        target_date = date(2026, 2, 12)
        SpecialDates.objects.create(user=self.user, date=target_date)
        scheduler = Scheduler(self.user)
        result = scheduler._schedule_task_split(task, target_date)
        self.assertFalse(result.success)

    def test_schedule_task_split_small_slot_break(self):
        # window 07:00 to 23:00.
        # min_block_minutes = 30.
        # Leave a 10 min slot.
        Event.objects.create(
            user=self.user, title="E1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 7, 10)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 23, 0))
        )
        task = Task.objects.create(
            user=self.user, title="T1", estimated_minutes=60, allow_split=True,
            start_time=timezone.now(), importance=5,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user, min_block_minutes=30)
        result = scheduler._schedule_task_split(task, target_date)
        self.assertFalse(result.success)

    def test_schedule_task_split_small_chunk_logic(self):
        # Testing chunk < min_block_minutes branch in _schedule_task_split
        # Window: 07:00 to 23:00.
        # Free: 07:00 - 07:40 (40m)
        Event.objects.create(
            user=self.user, title="B1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 7, 40)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 23, 0))
        )
        # Task 60m, min_block 50m. 
        # Day 1 only has 40m. 40 < 50. Should break the while loop for day 1.
        Task.objects.create(
            user=self.user, title="MinBlockTest", estimated_minutes=60,
            start_time=timezone.now(), importance=10, allow_split=True,
            deadline=timezone.make_aware(datetime(2026, 2, 14, 23, 59))
        )
        scheduler = Scheduler(self.user, max_days_ahead=3, allow_split=True, min_block_minutes=50)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertTrue(results[0].success)
        # Should not use Day 1 (Feb 12)
        self.assertNotEqual(results[0].segments[0][0].date(), date(2026, 2, 12))

    def test_get_scheduled_tasks(self):
        Task.objects.create(
            user=self.user, title="Scheduled", estimated_minutes=30,
            start_time=timezone.now(), deadline=timezone.now() + timedelta(days=1),
            importance=1,
            allocation=[{"start": "2026-02-12T08:00:00Z", "end": "2026-02-12T08:30:00Z"}]
        )
        scheduler = Scheduler(self.user)
        scheduled = scheduler._get_scheduled_tasks()
        self.assertEqual(len(scheduled), 1)
        self.assertEqual(scheduled[0].title, "Scheduled")

    def test_subtract_intervals_empty(self):
        scheduler = Scheduler(self.user)
        window = (datetime(2023, 1, 1, 9, 0), datetime(2023, 1, 1, 17, 0))
        free = scheduler._subtract_intervals(window, [])
        self.assertEqual(len(free), 1)
        self.assertEqual(free[0], window)

    def test_merge_intervals_touching(self):
        scheduler = Scheduler(self.user)
        intervals = [
            (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 11, 0)),
            (datetime(2023, 1, 1, 11, 0), datetime(2023, 1, 1, 12, 0)),
        ]
        merged = scheduler._merge_intervals(intervals)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0], (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 12, 0)))

    def test_clip_to_deadline_exact(self):
        scheduler = Scheduler(self.user)
        deadline = datetime(2023, 1, 1, 12, 0)
        slot = (deadline, datetime(2023, 1, 1, 13, 0))
        self.assertIsNone(scheduler._clip_to_deadline(slot, deadline))

    def test_schedule_task_deadline_passed(self):
        # start_date is Feb 12, deadline is Feb 10
        Task.objects.create(
            user=self.user, title="Old", estimated_minutes=30,
            start_time=timezone.now(), deadline=timezone.make_aware(datetime(2026, 2, 10, 10, 0)),
            importance=1
        )
        scheduler = Scheduler(self.user)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertFalse(results[0].success)
        self.assertEqual(results[0].reason, "Deadline already passed")

    def test_merge_intervals_identical(self):
        scheduler = Scheduler(self.user)
        intervals = [
            (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 12, 0)),
            (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 12, 0)),
        ]
        merged = scheduler._merge_intervals(intervals)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0][1].time(), time(12, 0))

    def test_get_available_slots_exact_max_hours(self):
        self.preference.limit_max_hours = True
        self.preference.max_hours_study_per_day = 1 # 60 mins
        self.preference.save()
        
        target_date = date(2026, 2, 12)
        # 60 mins already scheduled
        Task.objects.create(
            user=self.user, title="S1", estimated_minutes=60,
            start_time=timezone.now(), importance=1, deadline=timezone.now() + timedelta(days=1),
            allocation=[{"start": "2026-02-12T08:00:00Z", "end": "2026-02-12T09:00:00Z"}]
        )
        scheduler = Scheduler(self.user)
        slots = scheduler.get_available_slots(target_date, min_minutes=1)
        # Should have 0 mins remaining
        self.assertEqual(len(slots), 0)

    def test_get_available_slots_trim_partial(self):
        self.preference.limit_max_hours = True
        self.preference.max_hours_study_per_day = 1 # 60 mins
        self.preference.day_schedule = [
            {"day": i, "start": "08:00", "end": "22:00"} for i in range(1, 8)
        ]
        self.preference.save()
        
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user)
        scheduler._scheduled_blocks.append((
            timezone.make_aware(datetime.combine(target_date, time(8, 0))),
            timezone.make_aware(datetime.combine(target_date, time(8, 30)))
        ))
        
        slots = scheduler.get_available_slots(target_date, min_minutes=1)
        self.assertEqual(len(slots), 1)
        self.assertEqual(slots[0], (
            timezone.make_aware(datetime.combine(target_date, time(8, 30))),
            timezone.make_aware(datetime.combine(target_date, time(9, 0)))
        ))

    def test_get_occupied_slots_end_overlap(self):
        target_date = date(2026, 2, 12)
        # Event ends exactly at day_start or starts exactly at day_end
        day_start = timezone.make_aware(datetime.combine(target_date, time.min))
        day_end = timezone.make_aware(datetime.combine(target_date, time.max))
        
        # Event 1: ends at day_start
        Event.objects.create(
            user=self.user, title="E1",
            start_time=day_start - timedelta(hours=1),
            end_time=day_start
        )
        # Event 2: starts at day_end
        Event.objects.create(
            user=self.user, title="E2",
            start_time=day_end,
            end_time=day_end + timedelta(hours=1)
        )
        scheduler = Scheduler(self.user)
        occupied = scheduler._get_occupied_slots(target_date)
        self.assertEqual(len(occupied), 0)

    def test_schedule_task_split_nested_breaks(self):
        # Window: 07:00 - 23:00
        # Scenario: Free slot 07:00 - 07:40 (40m)
        Event.objects.create(
            user=self.user, title="B1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 7, 40)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 23, 0))
        )
        # Task 100m, min_block 60m. 
        # Free minutes (40) < min_block (60) AND remaining (100) > min_block (60).
        # This should trigger the first break.
        Task.objects.create(
            user=self.user, title="Break1", estimated_minutes=100,
            start_time=timezone.now(), importance=10, allow_split=True,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=True, min_block_minutes=60)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertFalse(results[0].success)

    def test_subtract_intervals_break(self):
        scheduler = Scheduler(self.user)
        # Window: 10:00 to 12:00
        window = (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 12, 0))
        # Occupied: 11:00 to 13:00 (ends after window)
        occupied = [(datetime(2023, 1, 1, 11, 0), datetime(2023, 1, 1, 13, 0))]
        free = scheduler._subtract_intervals(window, occupied)
        # Should break after processing the interval as cursor (13:00) >= end (12:00)
        self.assertEqual(len(free), 1)
        self.assertEqual(free[0], (datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 11, 0)))

    def test_get_occupied_slots_blocks_no_overlap(self):
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user)
        # Scheduled block on a different day
        start = timezone.make_aware(datetime.combine(date(2026, 2, 13), time(10, 0)))
        end = timezone.make_aware(datetime.combine(date(2026, 2, 13), time(11, 0)))
        scheduler._scheduled_blocks.append((start, end))
        
        occupied = scheduler._get_occupied_slots(target_date)
        self.assertEqual(len(occupied), 0)

    def test_get_available_slots_minutes_left_zero_break(self):
        self.preference.limit_max_hours = True
        self.preference.max_hours_study_per_day = 1 # 60 mins
        self.preference.save()
        
        target_date = date(2026, 2, 12)
        scheduler = Scheduler(self.user)
        # Schedule exactly 60 mins manually to trigger minutes_left <= 0 break
        scheduler._scheduled_blocks.append((
            timezone.make_aware(datetime.combine(target_date, time(8, 0))),
            timezone.make_aware(datetime.combine(target_date, time(9, 0)))
        ))
        
        slots = scheduler.get_available_slots(target_date, min_minutes=1)
        self.assertEqual(len(slots), 0)

    def test_schedule_task_split_last_piece_fits(self):
        # Day 1: 07:00 - 07:40 (40m)
        Event.objects.create(
            user=self.user, title="B1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 7, 40)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 23, 0))
        )
        # Task 50m, min_block 30m. 
        # Day 1: chunk=40, remaining=10.
        # Day 2: 07:00-23:00 available. chunk=min(10, 16h)=10.
        # chunk (10) < min_block (30) AND remaining (10) <= min_block (30).
        # This should trigger the "last small piece fits" logic.
        Task.objects.create(
            user=self.user, title="LastPiece", estimated_minutes=50,
            start_time=timezone.now(), importance=10, allow_split=True,
            deadline=timezone.make_aware(datetime(2026, 2, 14, 23, 59))
        )
        scheduler = Scheduler(self.user, max_days_ahead=2, allow_split=True, min_block_minutes=30)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertTrue(results[0].success)
        self.assertEqual(len(results[0].segments), 2)

    def test_schedule_task_no_split_no_slot(self):
        # Task 20 hours
        Task.objects.create(
            user=self.user, title="Huge", estimated_minutes=1200,
            start_time=timezone.now(), importance=1,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 23, 59))
        )
        # Only 16 hours available (7:00 to 23:00)
        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=False)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertFalse(results[0].success)
        self.assertEqual(results[0].reason, "No single slot available within horizon")

    def test_schedule_task_split_no_capped(self):
        # Trigger 'not capped' in _schedule_task_split
        Task.objects.create(
            user=self.user, title="Split", estimated_minutes=30,
            start_time=timezone.now(), importance=1, allow_split=True,
            deadline=timezone.make_aware(datetime(2026, 2, 12, 6, 30))
        )
        # Working window starts at 7:00. Deadline is 6:30.
        scheduler = Scheduler(self.user, max_days_ahead=1, allow_split=True)
        results = scheduler.schedule_tasks(start_date=date(2026, 2, 12))
        self.assertFalse(results[0].success)

    def test_schedule_tasks_no_segments(self):
        with patch.object(Scheduler, "_schedule_task_no_split") as mock_no_split:
            mock_no_split.return_value = ScheduleResult(
                task_id=1, success=True, 
                scheduled_start=timezone.now(),
                scheduled_end=timezone.now() + timedelta(minutes=30),
                segments=None
            )
            Task.objects.create(user=self.user, title="T1", estimated_minutes=30, start_time=timezone.now(), deadline=timezone.now() + timedelta(days=1), importance=1)
            scheduler = Scheduler(self.user)
            scheduler.schedule_tasks(start_date=date(2026, 2, 12))
            # Should hit Line 421 (else branch of if result.segments)

    def test_get_available_slots_malformed_allocation(self):
        Task.objects.create(
            user=self.user, title="Malformed", estimated_minutes=30,
            start_time=timezone.now(), deadline=timezone.now() + timedelta(days=1),
            importance=1,
            allocation=[{"start": "invalid"}]
        )
        self.preference.limit_max_hours = True
        self.preference.max_hours_study_per_day = 1
        self.preference.save()
        scheduler = Scheduler(self.user)
        # Should hit line 218->223 except block
        slots = scheduler.get_available_slots(date(2026, 2, 12), min_minutes=1)
        self.assertGreater(len(slots), 0)

    def test_get_available_slots_too_small(self):
        # Trigger line 257 False branch: slot smaller than min_minutes
        # window 07:00 to 23:00.
        # Add event to leave only 5 mins free at the beginning AND cover the rest.
        Event.objects.create(
            user=self.user, title="B1",
            start_time=timezone.make_aware(datetime(2026, 2, 12, 7, 5)),
            end_time=timezone.make_aware(datetime(2026, 2, 12, 23, 0))
        )
        scheduler = Scheduler(self.user)
        # Free slot is 07:00 to 07:05 (5 mins).
        # Request min_minutes = 10.
        slots = scheduler.get_available_slots(date(2026, 2, 12), min_minutes=10)
        self.assertEqual(len(slots), 0)
