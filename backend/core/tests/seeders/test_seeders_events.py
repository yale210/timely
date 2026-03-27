"""Tests for event-related core seeders."""

from datetime import datetime, time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.management.commands.seeders.assessment_seeder import AssessmentSeeder
from core.management.commands.seeders.event_seeder import EventSeeder
from core.management.commands.seeders.friendship_seeder import FriendshipSeeder
from core.management.commands.seeders.task_seeder import TaskSeeder
from core.models import Assessment, Category, Event, Friendship, Task

from .common import SeederTestCase


class SeederEventTests(SeederTestCase):
    """Test cases for seeder event."""

    def test_event_seeder_create_random_event_type_covers_recurring_and_nonrecurring_paths(
        self,
    ):
        """Test event seeder create random event type covers recurring and nonrecurring paths."""
        user = get_user_model().objects.create_user(
            username="event-owner",
            email="event-owner@example.com",
            password="password123",
        )
        category = Category.objects.create(user=user, text="Events", colour="#123456")
        seeder = EventSeeder()
        base_start = datetime(2026, 1, 1, 9, 0)

        with (
            patch.object(seeder, "_get_or_create_random_user", return_value=user),
            patch.object(
                seeder, "_get_or_create_random_category", return_value=category
            ),
            patch.object(
                seeder.faker, "date_time", side_effect=[base_start, base_start]
            ),
            patch(
                "core.management.commands.seeders.event_seeder.random.randint",
                side_effect=[1, 30, 45, 10],
            ),
            patch(
                "core.management.commands.seeders.event_seeder.random.choice",
                return_value="weekly",
            ),
        ):
            seeder._create_random_event_type(
                {"fields": {"user": user.id, "categories": [category.id]}}
            )

        recurring_event = Event.objects.get(user=user)
        self.assertEqual(recurring_event.recurrence_interval, "weekly")
        self.assertIsNotNone(recurring_event.recurrence_end)

        Event.objects.all().delete()
        with (
            patch.object(seeder, "_get_or_create_random_user", return_value=user),
            patch.object(
                seeder, "_get_or_create_random_category", return_value=category
            ),
            patch.object(
                seeder.faker, "date_time", side_effect=[base_start, base_start]
            ),
            patch(
                "core.management.commands.seeders.event_seeder.random.randint",
                side_effect=[0, 15],
            ),
        ):
            seeder._create_random_event_type(
                {"fields": {"user": user.id, "categories": [category.id]}}
            )

        single_event = Event.objects.get(user=user)
        self.assertIsNone(single_event.recurrence_interval)
        self.assertIsNone(single_event.recurrence_end)

    def test_event_seeder_create_recurring_event_and_random_time(self):
        """Test event seeder create recurring event and random time."""
        user = get_user_model().objects.create_user(
            username="event-recurring-owner",
            email="event-recurring@example.com",
            password="password123",
        )
        category = Category.objects.create(
            user=user, text="Repeating", colour="#123456"
        )
        seeder = EventSeeder()
        base_start = datetime(2026, 1, 2, 10, 0)

        with (
            patch.object(seeder.faker, "date_time", return_value=base_start),
            patch(
                "core.management.commands.seeders.event_seeder.random.randint",
                side_effect=[20, 10],
            ),
            patch(
                "core.management.commands.seeders.event_seeder.random.choice",
                return_value="daily",
            ),
        ):
            seeder._create_recurring_event(
                {"fields": {"user": user.id, "categories": [category.id]}}
            )

        event = Event.objects.get(user=user)
        self.assertEqual(event.recurrence_interval, "daily")
        self.assertEqual(event.categories.get(), category)

        with patch(
            "core.management.commands.seeders.event_seeder.random.randint",
            side_effect=[8, 45],
        ):
            self.assertEqual(seeder._random_time(), time(8, 45))

    def test_event_seeder_populate_random_event_and_fallback_helpers(self):
        """Test event seeder populate random event and fallback helpers."""
        seeder = EventSeeder()
        user = get_user_model().objects.create_user(
            username="event-helper-owner",
            email="event-helper@example.com",
            password="password123",
        )
        category = Category.objects.create(user=user, text="Helper", colour="#987654")

        with (
            patch.object(seeder, "_get_or_create_random_user", return_value=user),
            patch.object(
                seeder, "_get_or_create_random_category", return_value=category
            ),
            patch.object(seeder, "_create_random_event_type") as create_mock,
            patch(
                "core.management.commands.seeders.event_seeder.random.randint",
                side_effect=[1, 0],
            ),
        ):
            seeder._populate_random_event()
            seeder._populate_random_event()

        self.assertEqual(create_mock.call_count, 2)

        get_user_model().objects.all().delete()
        with patch.object(seeder, "faker") as faker:
            faker.user_name.return_value = "event-fallback-user"
            faker.email.return_value = "event-fallback@example.com"
            faker.word.return_value = "Fallback"
            faker.hex_color.return_value = "#456789"

            fallback_user = seeder._get_or_create_random_user()
            fallback_category = seeder._get_or_create_random_category(fallback_user)

        self.assertEqual(fallback_user.username, "event-fallback-user")
        self.assertEqual(fallback_category.user, fallback_user)

    def test_assessment_seeder_random_helpers_create_missing_user_and_category(self):
        """Test assessment seeder random helpers create missing user and category."""
        seeder = AssessmentSeeder()

        with patch.object(seeder, "faker") as faker:
            faker.user_name.return_value = "assessment-user"
            faker.email.return_value = "assessment@example.com"
            faker.word.return_value = "Assessments"
            faker.hex_color.return_value = "#445566"

            user = seeder._get_or_create_random_user()
            category = seeder._get_or_create_random_category(user)

        self.assertEqual(user.username, "assessment-user")
        self.assertEqual(category.user, user)
        self.assertEqual(category.colour, "#445566")

    def test_assessment_seeder_populate_random_assessment_links_unassigned_event(self):
        """Test assessment seeder populate random assessment links unassigned event."""
        user = get_user_model().objects.create_user(
            username="assessment-owner",
            email="assessment-owner@example.com",
            password="password123",
        )
        event = Event.objects.create(
            user=user,
            title="Exam slot",
            description="",
            location="Room 1",
            start_time=timezone.make_aware(datetime(2026, 2, 1, 9, 0)),
            end_time=timezone.make_aware(datetime(2026, 2, 1, 10, 0)),
        )
        seeder = AssessmentSeeder()
        due_date = datetime(2026, 2, 10, 12, 0)

        with (
            patch.object(seeder, "faker") as faker,
            patch(
                "core.management.commands.seeders.assessment_seeder.random.choice",
                return_value="EXAM",
            ),
            patch(
                "core.management.commands.seeders.assessment_seeder.random.randint",
                side_effect=[90, 25, 7],
            ),
        ):
            faker.sentence.side_effect = ["Assessment title", "Assessment notes"]
            faker.date_time.return_value = due_date
            seeder._populate_random_assessment()

        assessment = Assessment.objects.get(user=user, linked_event=event)
        self.assertEqual(assessment.assessment_type, "EXAM")

    def test_assessment_seeder_populate_random_assessment_event_creates_event_with_category(
        self,
    ):
        """Test assessment seeder populate random assessment event creates event with category."""
        user = get_user_model().objects.create_user(
            username="assessment-event-owner",
            email="assessment-event@example.com",
            password="password123",
        )
        category = Category.objects.create(user=user, text="Exam", colour="#334455")
        seeder = AssessmentSeeder()
        start = datetime(2026, 3, 1, 15, 0)

        with (
            patch.object(seeder, "_get_or_create_random_user", return_value=user),
            patch.object(
                seeder, "_get_or_create_random_category", return_value=category
            ),
            patch.object(seeder.faker, "date_time", return_value=start),
            patch.object(
                seeder.faker,
                "sentence",
                side_effect=["Assessment event", "Assessment description"],
            ),
            patch.object(seeder.faker, "word", return_value="Campus"),
            patch.object(seeder.faker, "hex_color", return_value="#abcdef"),
        ):
            seeder._populate_random_assessment_event()

        event = Event.objects.get(user=user, title="Assessment event")
        self.assertEqual(event.categories.get(), category)
        self.assertEqual(event.end_time, timezone.make_aware(start))

    def test_task_seeder_populate_random_task_can_link_parent_task(self):
        """Test task seeder populate random task can link parent task."""
        user = get_user_model().objects.create_user(
            username="task-owner",
            email="task-owner@example.com",
            password="password123",
        )
        category = Category.objects.create(user=user, text="Study", colour="#123456")
        parent_task = Task.objects.create(
            user=user,
            title="Parent task",
            description="Parent",
            estimated_minutes=30,
            start_time=timezone.make_aware(datetime(2026, 4, 1, 9, 0)),
            deadline=timezone.make_aware(datetime(2026, 4, 2, 9, 0)),
            completed=False,
            total_task_allocations=0,
            allocation=None,
            importance=5,
        )
        seeder = TaskSeeder()
        start_time = datetime(2026, 4, 3, 9, 0)
        deadline = datetime(2026, 4, 5, 9, 0)

        with (
            patch.object(seeder, "_get_or_create_random_user", return_value=user),
            patch.object(
                seeder, "_get_or_create_random_category", return_value=category
            ),
            patch.object(
                seeder.faker,
                "sentence",
                side_effect=["Child task", "Child description"],
            ),
            patch.object(seeder.faker, "date_time", side_effect=[start_time, deadline]),
            patch(
                "core.management.commands.seeders.task_seeder.random.randint",
                side_effect=[120, 120, 1, 1, 3, 8],
            ),
        ):
            seeder._populate_random_task()

        task = Task.objects.get(user=user, title="Child task")
        self.assertEqual(task.parent_task, parent_task)
        self.assertEqual(task.categories.get(), category)

    def test_task_seeder_fallback_helpers_create_user_and_category(self):
        """Test task seeder fallback helpers create user and category."""
        seeder = TaskSeeder()

        with patch.object(seeder, "faker") as faker:
            faker.user_name.return_value = "task-fallback-user"
            faker.email.return_value = "task-fallback@example.com"
            faker.word.return_value = "Fallback Task Category"
            faker.hex_color.return_value = "#223344"

            user = seeder._get_or_create_random_user()
            category = seeder._get_or_create_random_category(user)

        self.assertEqual(user.username, "task-fallback-user")
        self.assertEqual(category.user, user)

    def test_friendship_seeder_updates_existing_friendship_and_creates_users_if_missing(
        self,
    ):
        """Test friendship seeder updates existing friendship and creates users if missing."""
        sender = get_user_model().objects.create_user(
            username="sender",
            email="sender@example.com",
            password="password123",
        )
        receiver = get_user_model().objects.create_user(
            username="receiver",
            email="receiver@example.com",
            password="password123",
        )
        seeder = FriendshipSeeder()
        friendship = Friendship.objects.create(
            sender=receiver, receiver=sender, state="SENT"
        )

        result = seeder._create_friendship(
            {
                "fields": {
                    "sender": sender.id,
                    "receiver": receiver.id,
                    "state": "ACCEPTED",
                }
            }
        )
        self.assertEqual(result, friendship)
        self.assertEqual(Friendship.objects.count(), 1)

        Friendship.objects.all().delete()
        get_user_model().objects.all().delete()
        created_sender, created_receiver = seeder._get_or_create_two_random_users()
        self.assertNotEqual(created_sender.id, created_receiver.id)
