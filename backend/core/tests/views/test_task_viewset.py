"""Tests for task viewset."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Category, Event, Task
from profiles.models.profile import Profile


class TaskViewSetTests(TestCase):
    """Test cases for task view set."""

    def setUp(self):
        """Set up shared test fixtures."""
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
        self.client.force_authenticate(user=self.user)
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

    def create_task(self, **overrides):
        task = Task.objects.create(
            user=overrides.pop("user", self.user),
            title=overrides.pop("title", "Generated Task"),
            estimated_minutes=overrides.pop("estimated_minutes", 30),
            start_time=overrides.pop("start_time", self.now),
            completed=overrides.pop("completed", False),
            deadline=overrides.pop("deadline", self.now + datetime.timedelta(days=2)),
            importance=overrides.pop("importance", 1),
            **overrides,
        )
        return task

    @staticmethod
    def allocation_slot(start, end):
        return {"start": start.isoformat(), "end": end.isoformat()}

    def patch_task(self, payload, task=None):
        task = task or self.task1
        return self.client.patch(f"/api/tasks/{task.id}/", payload, format="json")

    def test_task_list_filters_by_user(self):
        self.create_task(
            user=self.other_user,
            title="Other user task",
            estimated_minutes=20,
            deadline=self.now + datetime.timedelta(days=4),
        )
        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_completed(self):
        response = self.client.get("/api/tasks/?completed=true")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task2.id)

        response = self.client.get("/api/tasks/?completed=false")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_filter_by_category(self):
        response = self.client.get(f"/api/tasks/?categories={self.category1.id}")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_ordering(self):
        response = self.client.get("/api/tasks/?ordering=-importance")
        self.assertEqual(response.data[0]["id"], self.task2.id)

        response = self.client.get("/api/tasks/?ordering=importance")
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_filter_by_date_range(self):
        start_date = (self.now + datetime.timedelta(hours=12)).isoformat()
        import urllib.parse

        encoded_date = urllib.parse.quote(start_date)
        response = self.client.get(f"/api/tasks/?start_time__gte={encoded_date}")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.task1.id)

    def test_task_list_requires_authentication(self):
        response = APIClient().get("/api/tasks/")
        self.assertIn(response.status_code, {401, 403})

    def test_create_task_via_api(self):
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
        event_start = self.now + datetime.timedelta(hours=2)
        event_end = event_start + datetime.timedelta(hours=1)
        Event.objects.create(
            user=self.user,
            title="Busy slot",
            start_time=event_start,
            end_time=event_end,
        )
        response = self.patch_task(
            {"allocation": [self.allocation_slot(event_start, event_end)]}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_allocation_rejects_buffer_overlap_with_event(self):
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
        response = self.patch_task(
            {
                "buffer_after_minutes": 15,
                "allocation": [self.allocation_slot(allocation_start, allocation_end)],
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_allocation_syncs_total_task_allocations(self):
        allocation_start = self.now + datetime.timedelta(days=1, hours=2)
        allocation_middle = allocation_start + datetime.timedelta(minutes=30)
        allocation_end = allocation_middle + datetime.timedelta(minutes=30)
        response = self.patch_task(
            {
                "allow_split": True,
                "allocation": [
                    self.allocation_slot(allocation_start, allocation_middle),
                    self.allocation_slot(allocation_middle, allocation_end),
                ],
                "total_task_allocations": 999,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.total_task_allocations, 2)

    def test_patch_task_allocation_rejects_category_daily_limit_overrun(self):
        self.category1.max_daily_study_time = 60
        self.category1.save(update_fields=["max_daily_study_time"])

        day_start = self.now.replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + datetime.timedelta(days=1)
        existing_start = day_start + datetime.timedelta(hours=8)
        existing_end = existing_start + datetime.timedelta(minutes=45)
        other_task = self.create_task(
            title="Existing study task",
            estimated_minutes=45,
            start_time=self.now + datetime.timedelta(days=1),
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            allocation=[self.allocation_slot(existing_start, existing_end)],
            total_task_allocations=1,
        )
        other_task.categories.add(self.category1)

        response = self.patch_task(
            {
                "allocation": [
                    self.allocation_slot(
                        existing_end + datetime.timedelta(minutes=15),
                        existing_end + datetime.timedelta(minutes=45),
                    )
                ]
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_allocation_rejects_buffer_overlap_with_other_task(self):
        other_start = self.now + datetime.timedelta(days=1, hours=4)
        other_end = other_start + datetime.timedelta(minutes=30)
        self.create_task(
            title="Buffered task",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            buffer_before_minutes=20,
            allocation=[self.allocation_slot(other_start, other_end)],
            total_task_allocations=1,
        )
        requested_end = other_start - datetime.timedelta(minutes=10)
        requested_start = requested_end - datetime.timedelta(minutes=30)
        response = self.patch_task(
            {"allocation": [self.allocation_slot(requested_start, requested_end)]}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("allocation", response.data)

    def test_patch_task_buffer_fields_persist(self):
        response = self.patch_task(
            {"buffer_before_minutes": 25, "buffer_after_minutes": 35}
        )
        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.buffer_before_minutes, 25)
        self.assertEqual(self.task1.buffer_after_minutes, 35)

    def test_patch_task_completed_minutes_persist(self):
        response = self.patch_task({"completed_minutes": 20})
        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.completed_minutes, 20)
        self.assertFalse(self.task1.completed)

    def test_patch_task_completed_true_clears_existing_allocation(self):
        allocation_start = self.now + datetime.timedelta(days=1, hours=2)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [self.allocation_slot(allocation_start, allocation_end)]
        self.task1.total_task_allocations = 1
        self.task1.save(update_fields=["allocation", "total_task_allocations"])

        response = self.patch_task({"completed": True})
        self.assertEqual(response.status_code, 200)
        self.task1.refresh_from_db()
        self.assertTrue(self.task1.completed)
        self.assertEqual(self.task1.completed_minutes, self.task1.estimated_minutes)
        self.assertEqual(self.task1.allocation, [])
        self.assertEqual(self.task1.total_task_allocations, 0)

    def test_patch_task_buffer_only_shows_reschedule_message_when_existing_schedule_conflicts(
        self,
    ):
        allocation_start = self.now + datetime.timedelta(days=1, hours=1)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [self.allocation_slot(allocation_start, allocation_end)]
        self.task1.total_task_allocations = 1
        self.task1.save(update_fields=["allocation", "total_task_allocations"])

        self.create_task(
            title="Adjacent scheduled task",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            allocation=[
                self.allocation_slot(
                    allocation_end,
                    allocation_end + datetime.timedelta(minutes=30),
                )
            ],
            total_task_allocations=1,
        )

        response = self.patch_task({"buffer_after_minutes": 10})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["buffer_after_minutes"][0],
            "This buffer conflicts with the task's current scheduled time because it would overlap another scheduled task. Reschedule or unschedule the task first.",
        )

    def test_save_and_reschedule_reoptimizes_all_tasks_for_new_buffer(self):
        allocation_start = self.now + datetime.timedelta(days=1, hours=1)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [self.allocation_slot(allocation_start, allocation_end)]
        self.task1.total_task_allocations = 1
        self.task1.save(update_fields=["allocation", "total_task_allocations"])

        other_task = self.create_task(
            title="Adjacent scheduled task",
            estimated_minutes=30,
            start_time=self.now + datetime.timedelta(days=1),
            deadline=self.now + datetime.timedelta(days=2),
            importance=4,
            allocation=[
                self.allocation_slot(
                    allocation_end,
                    allocation_end + datetime.timedelta(minutes=30),
                )
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
        allocation_start = self.now + datetime.timedelta(days=1, hours=1)
        allocation_end = allocation_start + datetime.timedelta(minutes=30)
        self.task1.allocation = [self.allocation_slot(allocation_start, allocation_end)]
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
