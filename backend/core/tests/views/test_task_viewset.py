"""Tests for task viewset."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Category, Event, Task
from profiles.models.profile import Profile


class TaskViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="viewuser", password="password123", email="view@user.com"
        )
        self.other_user = get_user_model().objects.create_user(
            username="otheruser", password="password123", email="other@user.com"
        )
        Profile.objects.create(user=self.user, name="View User")
        Profile.objects.create(user=self.other_user, name="Other User")
        self.category1 = Category.objects.create(user=self.user, text="Work")
        self.category2 = Category.objects.create(user=self.user, text="Home")

        self.now = timezone.now()

        # Create some tasks
        self.task1 = Task.objects.create(
            user=self.user,
            title="Task 1",
            estimated_minutes=60,
            start_time=self.now + datetime.timedelta(days=1),
            completed=False,
            deadline=self.now + datetime.timedelta(days=10),
            importance=2,
        )
        self.task1.categories.add(self.category1)

        self.task2 = Task.objects.create(
            user=self.user,
            title="Task 2",
            estimated_minutes=45,
            start_time=self.now,
            completed=True,
            deadline=self.now + datetime.timedelta(days=5),
            importance=8,
        )
        self.task2.categories.add(self.category2)

    def test_task_list_filters_by_user(self):
        Task.objects.create(
            user=self.other_user,
            title="Other user task",
            estimated_minutes=20,
            start_time=self.now,
            completed=False,
            deadline=self.now + datetime.timedelta(days=4),
            importance=1,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_completed(self):
        self.client.force_authenticate(user=self.user)

        # Filter completed
        response = self.client.get("/api/tasks/?completed=true")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task2.id)

        # Filter incomplete
        response = self.client.get("/api/tasks/?completed=false")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_filter_by_category(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/tasks/?categories={self.category1.id}")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_ordering(self):
        self.client.force_authenticate(user=self.user)

        # Order by importance descending
        response = self.client.get("/api/tasks/?ordering=-importance")
        self.assertEqual(response.data[0]["id"], self.task2.id)  # 8 > 2

        # Order by importance ascending
        response = self.client.get("/api/tasks/?ordering=importance")
        self.assertEqual(response.data[0]["id"], self.task1.id)  # 2 < 8

    def test_filter_by_date_range(self):
        self.client.force_authenticate(user=self.user)

        # Filter by start_time__gte
        start_date = (self.now + datetime.timedelta(hours=12)).isoformat()
        import urllib.parse

        encoded_date = urllib.parse.quote(start_date)
        response = self.client.get(f"/api/tasks/?start_time__gte={encoded_date}")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_task_list_requires_authentication(self):
        response = self.client.get("/api/tasks/")
        self.assertIn(response.status_code, {401, 403})

    def test_create_task_via_api(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "title": "New API Task",
            "estimated_minutes": 60,
            "start_time": (self.now + datetime.timedelta(hours=1)).isoformat(),
            "deadline": (self.now + datetime.timedelta(days=2)).isoformat(),
            "importance": 7,
            "completed": False,
            "categories": [self.category1.id],
        }
        response = self.client.post("/api/tasks/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Task.objects.filter(user=self.user).count(), 3)
        new_task = Task.objects.get(title="New API Task")
        self.assertEqual(new_task.user, self.user)
        self.assertEqual(new_task.importance, 7)

    def test_patch_task_allocation_rejects_overlap_with_event(self):
        self.client.force_authenticate(user=self.user)
        event_start = self.now + datetime.timedelta(hours=2)
        event_end = event_start + datetime.timedelta(hours=1)

        Event.objects.create(
            user=self.user,
            title="Busy slot",
            start_time=event_start,
            end_time=event_end,
        )

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "allocation": [
                    {
                        "start": event_start.isoformat(),
                        "end": event_end.isoformat(),
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_allocation_rejects_buffer_overlap_with_event(self):
        self.client.force_authenticate(user=self.user)
        event_start = self.now + datetime.timedelta(hours=3)
        event_end = event_start + datetime.timedelta(hours=1)

        Event.objects.create(
            user=self.user,
            title="Busy slot",
            start_time=event_start,
            end_time=event_end,
        )

        allocation_end = event_start - datetime.timedelta(minutes=5)
        allocation_start = allocation_end - datetime.timedelta(minutes=30)

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "buffer_after_minutes": 15,
                "allocation": [
                    {
                        "start": allocation_start.isoformat(),
                        "end": allocation_end.isoformat(),
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_allocation_syncs_total_task_allocations(self):
        self.client.force_authenticate(user=self.user)
        allocation_start = self.now + datetime.timedelta(days=1, hours=2)
        allocation_middle = allocation_start + datetime.timedelta(minutes=30)
        allocation_end = allocation_middle + datetime.timedelta(minutes=30)

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "allow_split": True,
                "allocation": [
                    {
                        "start": allocation_start.isoformat(),
                        "end": allocation_middle.isoformat(),
                    },
                    {
                        "start": allocation_middle.isoformat(),
                        "end": allocation_end.isoformat(),
                    },
                ],
                "total_task_allocations": 999,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.total_task_allocations, 2)

    def test_patch_task_allocation_rejects_category_daily_limit_overrun(self):
        self.client.force_authenticate(user=self.user)
        self.category1.max_daily_study_time = 60
        self.category1.save(update_fields=["max_daily_study_time"])

        day_start = self.now.replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + datetime.timedelta(days=1)
        existing_start = day_start + datetime.timedelta(hours=8)
        existing_end = existing_start + datetime.timedelta(minutes=45)
        other_task = Task.objects.create(
            user=self.user,
            title="Existing study task",
            estimated_minutes=45,
            start_time=self.now + datetime.timedelta(days=1),
            completed=False,
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            allocation=[
                {
                    "start": existing_start.isoformat(),
                    "end": existing_end.isoformat(),
                }
            ],
            total_task_allocations=1,
        )
        other_task.categories.add(self.category1)

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "allocation": [
                    {
                        "start": (
                            existing_end + datetime.timedelta(minutes=15)
                        ).isoformat(),
                        "end": (
                            existing_end + datetime.timedelta(minutes=45)
                        ).isoformat(),
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_allocation_rejects_buffer_overlap_with_other_task(self):
        self.client.force_authenticate(user=self.user)
        other_start = self.now + datetime.timedelta(days=1, hours=4)
        other_end = other_start + datetime.timedelta(minutes=30)

        Task.objects.create(
            user=self.user,
            title="Buffered task",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            completed=False,
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            buffer_before_minutes=20,
            allocation=[
                {
                    "start": other_start.isoformat(),
                    "end": other_end.isoformat(),
                }
            ],
            total_task_allocations=1,
        )

        requested_end = other_start - datetime.timedelta(minutes=10)
        requested_start = requested_end - datetime.timedelta(minutes=30)

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "allocation": [
                    {
                        "start": requested_start.isoformat(),
                        "end": requested_end.isoformat(),
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_buffer_fields_persist(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "buffer_before_minutes": 25,
                "buffer_after_minutes": 35,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.buffer_before_minutes, 25)
        self.assertEqual(self.task1.buffer_after_minutes, 35)

    def test_patch_task_completed_minutes_persist(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "completed_minutes": 20,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.completed_minutes, 20)
        self.assertFalse(self.task1.completed)

    def test_patch_task_buffer_only_shows_reschedule_message_when_existing_schedule_conflicts(
        self,
    ):
        self.client.force_authenticate(user=self.user)
        allocation_start = self.now + datetime.timedelta(days=1, hours=1)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [
            {
                "start": allocation_start.isoformat(),
                "end": allocation_end.isoformat(),
            }
        ]
        self.task1.total_task_allocations = 1
        self.task1.save(update_fields=["allocation", "total_task_allocations"])

        Task.objects.create(
            user=self.user,
            title="Adjacent scheduled task",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            completed=False,
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            allocation=[
                {
                    "start": allocation_end.isoformat(),
                    "end": (
                        allocation_end + datetime.timedelta(minutes=30)
                    ).isoformat(),
                }
            ],
            total_task_allocations=1,
        )

        response = self.client.patch(
            f"/api/tasks/{self.task1.id}/",
            {
                "buffer_after_minutes": 10,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["buffer_after_minutes"][0],
            "This buffer conflicts with the task's current scheduled time because it would overlap another scheduled task. Reschedule or unschedule the task first.",
        )

    def test_save_and_reschedule_reoptimizes_all_tasks_for_new_buffer(self):
        self.client.force_authenticate(user=self.user)
        allocation_start = self.now + datetime.timedelta(days=1, hours=1)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [
            {
                "start": allocation_start.isoformat(),
                "end": allocation_end.isoformat(),
            }
        ]
        self.task1.total_task_allocations = 1
        self.task1.save(update_fields=["allocation", "total_task_allocations"])

        other_task = Task.objects.create(
            user=self.user,
            title="Adjacent scheduled task",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            completed=False,
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            allocation=[
                {
                    "start": allocation_end.isoformat(),
                    "end": (
                        allocation_end + datetime.timedelta(minutes=30)
                    ).isoformat(),
                }
            ],
            total_task_allocations=1,
        )

        response = self.client.post(
            f"/api/tasks/{self.task1.id}/save-and-reschedule/",
            {
                "buffer_after_minutes": 10,
                "start_date": (self.now + datetime.timedelta(days=1))
                .date()
                .isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        other_task.refresh_from_db()
        self.assertEqual(self.task1.buffer_after_minutes, 10)
        self.assertEqual(self.task1.total_task_allocations, 1)
        self.assertEqual(other_task.total_task_allocations, 1)
        self.assertNotEqual(
            self.task1.allocation[0]["start"],
            allocation_start.isoformat(),
        )

    def test_save_and_reschedule_keeps_task_changes_when_rescheduling_fails(self):
        self.client.force_authenticate(user=self.user)
        allocation_start = self.now + datetime.timedelta(days=1, hours=1)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [
            {
                "start": allocation_start.isoformat(),
                "end": allocation_end.isoformat(),
            }
        ]
        self.task1.total_task_allocations = 1
        self.task1.save(update_fields=["allocation", "total_task_allocations"])

        updated_start_time = self.now + datetime.timedelta(days=9, hours=23)
        updated_deadline = updated_start_time + datetime.timedelta(minutes=30)
        response = self.client.post(
            f"/api/tasks/{self.task1.id}/save-and-reschedule/",
            {
                "start_time": updated_start_time.isoformat(),
                "deadline": updated_deadline.isoformat(),
                "estimated_minutes": 60,
                "start_date": self.now.date().isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["reschedule_warning"],
            "No single slot available within horizon",
        )
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.start_time, updated_start_time)
        self.assertEqual(self.task1.allocation, [])
        self.assertEqual(self.task1.total_task_allocations, 0)
