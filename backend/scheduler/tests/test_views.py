from datetime import datetime, timedelta, time

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Event, Preference, Task


class SchedulerViewsTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="scheduser", password="password123", email="sched@user.com"
        )
        self.client.force_authenticate(user=self.user)
        self.schedule_url = reverse("schedule-tasks")
        self.unschedule_url = reverse("unschedule-tasks")

    def test_schedule_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.schedule_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unschedule_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.unschedule_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_schedule_success_updates_allocation_without_mutating_task_window(self):
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Schedule me",
            description="",
            estimated_minutes=30,
            start_time=now,
            deadline=now + timedelta(days=1),
            importance=5,
            completed=False,
        )

        response = self.client.post(
            self.schedule_url,
            {"start_date": now.date().isoformat(), "allow_split": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertGreater(len(task.allocation), 0)
        self.assertEqual(task.total_task_allocations, len(task.allocation))
        self.assertEqual(task.start_time, now)
        self.assertEqual(task.deadline, now + timedelta(days=1))

    def test_schedule_split_creates_multiple_segments(self):
        base_date = timezone.localdate() + timedelta(days=1)
        day1_start = timezone.make_aware(datetime.combine(base_date, time.min))
        day1_block_start = day1_start + timedelta(hours=1)
        day2 = base_date + timedelta(days=1)
        day2_start = timezone.make_aware(datetime.combine(day2, time.min))
        day2_block_start = day2_start + timedelta(hours=1)

        # Block most of each day so only 1-hour slots remain at the start.
        Event.objects.create(
            user=self.user,
            title="Block Day 1",
            start_time=day1_block_start,
            end_time=day1_start + timedelta(hours=23, minutes=59),
        )
        Event.objects.create(
            user=self.user,
            title="Block Day 2",
            start_time=day2_block_start,
            end_time=day2_start + timedelta(hours=23, minutes=59),
        )

        task = Task.objects.create(
            user=self.user,
            title="Split task",
            description="",
            estimated_minutes=120,
            start_time=day1_start,
            deadline=day2_start + timedelta(hours=2),
            importance=5,
            completed=False,
            allow_split=True,
        )

        response = self.client.post(
            self.schedule_url,
            {
                "start_date": base_date.isoformat(),
                "allow_split": True,
                "min_block_minutes": 30,
                "max_days_ahead": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertGreaterEqual(len(task.allocation), 2)
        self.assertEqual(task.total_task_allocations, len(task.allocation))

    def test_unschedule_resets_allocation_without_mutating_task_window(self):
        now = timezone.now()
        original_start_time = now - timedelta(hours=2)
        original_deadline = now + timedelta(days=1)
        task = Task.objects.create(
            user=self.user,
            title="Unschedule me",
            description="",
            estimated_minutes=30,
            start_time=original_start_time,
            deadline=original_deadline,
            importance=5,
            completed=False,
            allocation=[
                {
                    "start": (now - timedelta(hours=2)).isoformat(),
                    "end": (now - timedelta(hours=1, minutes=30)).isoformat(),
                }
            ],
            total_task_allocations=1,
        )

        response = self.client.post(self.unschedule_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.allocation, [])
        self.assertEqual(task.total_task_allocations, 0)
        self.assertEqual(task.start_time, original_start_time)
        self.assertEqual(task.deadline, original_deadline)

    def test_schedule_uses_saved_preference_horizon_when_request_omits_it(self):
        base_date = timezone.localdate() + timedelta(days=1)
        Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
            max_days_ahead=30,
        )

        for offset in range(8):
            blocked_day = base_date + timedelta(days=offset)
            Event.objects.create(
                user=self.user,
                title=f"Block {blocked_day.isoformat()}",
                start_time=timezone.make_aware(datetime.combine(blocked_day, time(7, 0))),
                end_time=timezone.make_aware(datetime.combine(blocked_day, time(23, 0))),
            )

        task = Task.objects.create(
            user=self.user,
            title="Late horizon task",
            description="",
            estimated_minutes=30,
            start_time=timezone.make_aware(datetime.combine(base_date, time(7, 0))),
            deadline=timezone.make_aware(datetime.combine(base_date + timedelta(days=9), time(23, 0))),
            importance=5,
            completed=False,
            allow_split=True,
        )

        response = self.client.post(
            self.schedule_url,
            {"start_date": base_date.isoformat(), "allow_split": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.total_task_allocations, 1)

    def test_schedule_with_replace_existing_reschedules_without_separate_unschedule(self):
        now = timezone.now()
        original_start = now + timedelta(hours=1)
        Event.objects.create(
            user=self.user,
            title="Block original slot",
            start_time=original_start,
            end_time=original_start + timedelta(minutes=30),
        )
        task = Task.objects.create(
            user=self.user,
            title="Reschedule me safely",
            description="",
            estimated_minutes=30,
            start_time=now,
            deadline=now + timedelta(days=1),
            importance=5,
            completed=False,
            allocation=[
                {
                    "start": original_start.isoformat(),
                    "end": (original_start + timedelta(minutes=30)).isoformat(),
                }
            ],
            total_task_allocations=1,
        )

        response = self.client.post(
            self.schedule_url,
            {
                "start_date": now.date().isoformat(),
                "allow_split": False,
                "replace_existing": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.total_task_allocations, len(task.allocation))
        self.assertNotEqual(task.allocation[0]["start"], original_start.isoformat())
