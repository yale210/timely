"""Tests for calendar allocation validation behaviour."""

import datetime

from django.utils import timezone
from django.utils.timezone import make_aware
from rest_framework import serializers

from core.models import Category, Event, Task
from core.serializers import CalendarSerializer

from .calendar_serializer_test_support import CalendarSerializerTestSupport


class CalendarSerializerAllocationConflictTests(CalendarSerializerTestSupport):
    """Test cases for calendar serializer allocation conflict."""

    def test_validate_allocation_slots_rejects_overlap_with_events_other_tasks_and_category_limits(
        self,
    ):
        """Test validate allocation slots rejects overlap with events other tasks and category limits."""
        serializer = CalendarSerializer(context=self._request_context())
        tomorrow = timezone.localdate() + datetime.timedelta(days=1)
        now = make_aware(datetime.datetime.combine(tomorrow, datetime.time(9, 0)))
        category = Category.objects.create(
            user=self.user,
            text="Capped",
            max_daily_study_time=45,
        )

        Event.objects.create(
            user=self.user,
            title="Lecture",
            start_time=now + datetime.timedelta(minutes=20),
            end_time=now + datetime.timedelta(minutes=50),
        )
        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=35)).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=15,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        Event.objects.all().delete()
        other_task = Task.objects.create(
            user=self.user,
            title="Existing task",
            description="",
            estimated_minutes=60,
            start_time=now,
            deadline=now + datetime.timedelta(hours=4),
            importance=5,
            allocation=[
                {
                    "start": (now + datetime.timedelta(minutes=40)).isoformat(),
                    "end": (now + datetime.timedelta(minutes=70)).isoformat(),
                }
            ],
            total_task_allocations=1,
            buffer_before_minutes=10,
        )
        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=35)).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=20,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        other_task.delete()
        limited_task = Task.objects.create(
            user=self.user,
            title="Limited task",
            description="",
            estimated_minutes=60,
            start_time=now,
            deadline=now + datetime.timedelta(hours=4),
            importance=5,
            allocation=[
                {
                    "start": now.isoformat(),
                    "end": (now + datetime.timedelta(minutes=30)).isoformat(),
                }
            ],
            total_task_allocations=1,
        )
        limited_task.categories.add(category)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": (now + datetime.timedelta(hours=1)).isoformat(),
                        "end": (
                            now + datetime.timedelta(hours=1, minutes=30)
                        ).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=4),
                categories=[category],
                estimated_minutes=60,
                completed_minutes=0,
            )

    def test_validate_rewrites_buffer_only_conflicts_to_buffer_fields(self):
        """Test validate rewrites buffer only conflicts to buffer fields."""
        now = timezone.now() + datetime.timedelta(days=1)
        task = Task.objects.create(
            user=self.user,
            title="Buffered task",
            description="",
            estimated_minutes=60,
            start_time=now,
            deadline=now + datetime.timedelta(hours=3),
            importance=5,
            allocation=[
                {
                    "start": now.isoformat(),
                    "end": (now + datetime.timedelta(minutes=30)).isoformat(),
                }
            ],
            total_task_allocations=1,
        )
        Event.objects.create(
            user=self.user,
            title="Blocking event",
            start_time=now + datetime.timedelta(minutes=35),
            end_time=now + datetime.timedelta(minutes=50),
        )

        serializer = CalendarSerializer(
            instance=task,
            data={"buffer_after_minutes": 10},
            partial=True,
            context=self._request_context(),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("buffer_after_minutes", serializer.errors)

    def test_validate_sets_completed_flags_and_resolves_user_from_instance(self):
        """Test validate sets completed flags and resolves user from instance."""
        now = timezone.now() + datetime.timedelta(days=1)
        task = Task.objects.create(
            user=self.user,
            title="Existing",
            description="",
            estimated_minutes=60,
            start_time=now,
            deadline=now + datetime.timedelta(hours=3),
            importance=5,
            completed=False,
        )

        create_serializer = CalendarSerializer(
            data=self._base_data(completed=True, completed_minutes=15),
            context=self._request_context(),
        )
        self.assertTrue(create_serializer.is_valid(), create_serializer.errors)
        created = create_serializer.save(user=self.user)
        self.assertTrue(created.completed)
        self.assertEqual(created.completed_minutes, 60)
        self.assertEqual(created.allocation, [])
        self.assertEqual(created.total_task_allocations, 0)

        update_serializer = CalendarSerializer(
            instance=task,
            data={"completed": False},
            partial=True,
            context=self._request_context(),
        )
        self.assertTrue(update_serializer.is_valid(), update_serializer.errors)
        updated = update_serializer.save()
        self.assertFalse(updated.completed)
        self.assertEqual(updated.completed_minutes, 0)
