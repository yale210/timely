"""Tests for calendar serializer."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.utils.timezone import make_aware
from rest_framework import serializers
from rest_framework.test import APIRequestFactory

from core.models import Category, Event, Task
from core.serializers import CalendarSerializer
from core.serializers.calendar import CalendarResponseSerializer


class CalendarSerializerTests(TestCase):
    """Test cases for calendar serializer."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="serializeruser", password="password123", email="test@user.com"
        )
        self.request_factory = APIRequestFactory()
        self.category1 = Category.objects.create(user=self.user, text="Study")
        self.category2 = Category.objects.create(user=self.user, text="Work")

    def _request_context(self):
        """Request context."""
        request = self.request_factory.post("/api/tasks/")
        request.user = self.user
        return {"request": request}

    def _base_data(self, **overrides):
        """Base data."""
        now = timezone.now() + datetime.timedelta(days=1)
        data = {
            "title": "Task",
            "description": "",
            "estimated_minutes": 60,
            "completed_minutes": 0,
            "start_time": now.isoformat(),
            "deadline": (now + datetime.timedelta(hours=3)).isoformat(),
            "importance": 5,
            "completed": False,
            "categories": [],
            "allocation": [],
        }
        data.update(overrides)
        return data

    def test_calendar_serializer_fields(self):
        """Test calendar serializer fields."""
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Read notes",
            description="Reading some notes for exam",
            estimated_minutes=60,
            start_time=now,
            completed=False,
            deadline=now + datetime.timedelta(days=2),
            importance=4,
        )
        task.categories.add(self.category1, self.category2)

        data = CalendarSerializer(task).data

        self.assertEqual(data["title"], "Read notes")
        self.assertEqual(data["description"], "Reading some notes for exam")

        self.assertEqual(len(data["categories"]), 2)
        cat_texts = [cat["text"] for cat in data["categories"]]
        self.assertIn("Study", cat_texts)
        self.assertIn("Work", cat_texts)

        self.assertEqual(
            set(data.keys()),
            {
                "id",
                "title",
                "description",
                "categories",
                "colour",
                "start_time",
                "deadline",
                "importance",
                "completed",
                "completed_minutes",
                "remaining_minutes",
                "locked",
                "allow_split",
                "min_split_minutes",
                "max_split_minutes",
                "buffer_before_minutes",
                "buffer_after_minutes",
                "estimated_minutes",
                "parent_task",
                "allocation",
                "total_task_allocations",
            },
        )

    def test_calendar_serializer_create_with_categories(self):
        """Test calendar serializer create with categories."""
        now = timezone.now()
        data = {
            "title": "New Task",
            "description": "New Desc",
            "estimated_minutes": 30,
            "start_time": now.isoformat(),
            "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
            "importance": 5,
            "completed": False,
            "completed_minutes": 10,
            "categories": [self.category1.id, self.category2.id],
            "allow_split": True,
            "min_split_minutes": 30,
            "max_split_minutes": 60,
            "buffer_before_minutes": 15,
            "buffer_after_minutes": 20,
        }

        serializer = CalendarSerializer(data=data, context=self._request_context())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        task = serializer.save(user=self.user)

        self.assertEqual(task.categories.count(), 2)
        self.assertIn(self.category1, task.categories.all())
        self.assertEqual(task.min_split_minutes, 30)
        self.assertEqual(task.max_split_minutes, 60)
        self.assertEqual(task.completed_minutes, 10)
        self.assertEqual(task.buffer_before_minutes, 15)
        self.assertEqual(task.buffer_after_minutes, 20)

    def test_calendar_serializer_rejects_max_split_below_minimum(self):
        """Test calendar serializer rejects max split below minimum."""
        now = timezone.now()
        serializer = CalendarSerializer(
            data={
                "title": "Invalid split settings",
                "description": "",
                "estimated_minutes": 30,
                "start_time": now.isoformat(),
                "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
                "importance": 5,
                "completed": False,
                "allow_split": True,
                "min_split_minutes": 60,
                "max_split_minutes": 30,
                "categories": [],
            },
            context=self._request_context(),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("max_split_minutes", serializer.errors)

    def test_calendar_serializer_marks_task_complete_when_completed_minutes_reaches_estimate(
        self,
    ):
        """Test calendar serializer marks task complete when completed minutes reaches estimate."""
        now = timezone.now()
        serializer = CalendarSerializer(
            data={
                "title": "Finished task",
                "description": "",
                "estimated_minutes": 45,
                "completed_minutes": 45,
                "start_time": now.isoformat(),
                "deadline": (now + datetime.timedelta(hours=2)).isoformat(),
                "importance": 5,
                "completed": False,
                "categories": [],
            },
            context=self._request_context(),
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        task = serializer.save(user=self.user)
        self.assertTrue(task.completed)
        self.assertEqual(task.remaining_minutes, 0)

    def test_calendar_serializer_rejects_completed_minutes_above_estimate(self):
        """Test calendar serializer rejects completed minutes above estimate."""
        now = timezone.now()
        serializer = CalendarSerializer(
            data={
                "title": "Too much progress",
                "description": "",
                "estimated_minutes": 30,
                "completed_minutes": 40,
                "start_time": now.isoformat(),
                "deadline": (now + datetime.timedelta(hours=1)).isoformat(),
                "importance": 5,
                "completed": False,
                "categories": [],
            },
            context=self._request_context(),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("completed_minutes", serializer.errors)

    def test_parse_allocation_slots_collects_errors_and_normalizes_valid_datetimes(
        self,
    ):
        """Test parse allocation slots collects errors and normalizes valid datetimes."""
        serializer = CalendarSerializer(context=self._request_context())

        normalized, errors = serializer._parse_allocation_slots(
            [
                "not-a-dict",
                {},
                {"start": "not-iso", "end": "still-not-iso"},
                {
                    "start": "2026-03-20T10:00:00",
                    "end": "2026-03-20T09:00:00",
                },
                {
                    "start": "2026-03-20T10:00:00",
                    "end": "2026-03-20T11:00:00",
                },
            ]
        )

        self.assertEqual(len(errors), 4)
        self.assertEqual(len(normalized), 1)
        self.assertTrue(timezone.is_aware(normalized[0][0]))

    def test_minutes_by_day_splits_cross_midnight(self):
        """Test minutes by day splits cross midnight."""
        serializer = CalendarSerializer(context=self._request_context())
        start = make_aware(datetime.datetime(2026, 3, 20, 23, 30))
        end = make_aware(datetime.datetime(2026, 3, 21, 0, 30))

        minutes_by_day = serializer._minutes_by_day([(start, end)])

        self.assertEqual(minutes_by_day[start.date()], 30)
        self.assertEqual(minutes_by_day[end.date()], 30)

    def test_validate_allocation_slots_rejects_non_list(self):
        """Test validate allocation slots rejects non list."""
        serializer = CalendarSerializer(context=self._request_context())

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation="invalid",
                allow_split=False,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=None,
                deadline=None,
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_multiple_slots_without_split(self):
        """Test validate allocation slots rejects multiple slots without split."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=30)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=30)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=60)).isoformat(),
                    },
                ],
                allow_split=False,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_start_deadline_and_remaining_limit_errors(
        self,
    ):
        """Test validate allocation slots rejects start deadline and remaining limit errors."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": (now - datetime.timedelta(minutes=30)).isoformat(),
                        "end": now.isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(hours=3)).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(hours=2)).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=30,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_min_max_and_overlap_errors(self):
        """Test validate allocation slots rejects min max and overlap errors."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=10)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=20)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=40)).isoformat(),
                    },
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=60,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=70)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=70)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=80)).isoformat(),
                    },
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=60,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=120,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=30)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=20)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=50)).isoformat(),
                    },
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=60,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=120,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_overlap_with_events_other_tasks_and_category_limits(
        self,
    ):
        """Test validate allocation slots rejects overlap with events other tasks and category limits."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)
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

    def test_calendar_response_serializer_covers_representation_and_validation(self):
        """Test calendar response serializer covers representation and validation."""
        now = timezone.now()
        task = Task.objects.create(
            user=self.user,
            title="Response task",
            description="",
            estimated_minutes=90,
            completed_minutes=30,
            start_time=now,
            deadline=now + datetime.timedelta(hours=2),
            importance=5,
        )
        task.categories.add(self.category1)

        data = CalendarResponseSerializer(task).data
        self.assertEqual(data["remaining_minutes"], 60)
        self.assertEqual(data["categories"][0]["text"], self.category1.text)

        serializer = CalendarResponseSerializer(
            instance=task,
            data={"min_split_minutes": 60, "max_split_minutes": 30},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("max_split_minutes", serializer.errors)
