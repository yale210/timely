"""Tests for foundational core seeders."""

from datetime import time
from unittest.mock import patch

from django.contrib.auth import get_user_model

from core.management.commands.seeders import (
    assessment_seeder,
    category_seeder,
    event_seeder,
    friendship_seeder,
    grade_seeder,
    preference_seeder,
    special_dates_seeder,
    task_seeder,
    user_seeder,
)
from core.management.commands.seeders.assessment_seeder import AssessmentSeeder
from core.management.commands.seeders.category_seeder import CategorySeeder
from core.management.commands.seeders.day_of_week_seeder import DayOfWeekSeeder
from core.management.commands.seeders.event_seeder import EventSeeder
from core.management.commands.seeders.friendship_seeder import FriendshipSeeder
from core.management.commands.seeders.grade_seeder import GradeSeeder
from core.management.commands.seeders.preference_seeder import PreferenceSeeder
from core.management.commands.seeders.special_dates_seeder import SpecialDatesSeeder
from core.management.commands.seeders.task_seeder import TaskSeeder
from core.management.commands.seeders.user_seeder import UserSeeder
from core.models import (
    Assessment,
    Category,
    DayOfWeek,
    Event,
    Friendship,
    Grade,
    Preference,
    SpecialDates,
    Task,
)
from core.models.preference import default_day_schedule
from profiles.management.commands.seeders.profile_seeder import ProfileSeeder
from profiles.models import Profile

from .common import SeederTestCase


class SeederFoundationTests(SeederTestCase):
    """Test cases for seeder foundation."""

    def _assert_fixture_creation_error(
        self,
        seeder,
        fixture_method: str,
        create_method: str,
        module,
        fixture_name: str,
        message: str,
    ) -> None:
        """Assert that a fixture seeder prints the expected creation error."""
        with self.subTest(fixture_method=fixture_method):
            with (
                patch.object(module, fixture_name, [{}]),
                patch.object(seeder, create_method, side_effect=Exception("boom")),
                patch("builtins.print") as print_mock,
            ):
                getattr(seeder, fixture_method)()

            print_mock.assert_called_once_with(message)

    def test_fixture_seeders_are_idempotent(self):
        """Test fixture seeders are idempotent."""
        self.seed_fixture_data()
        initial_counts = {
            "users": get_user_model().objects.count(),
            "categories": Category.objects.count(),
            "days": DayOfWeek.objects.count(),
            "events": Event.objects.count(),
            "grades": Grade.objects.count(),
            "preferences": Preference.objects.count(),
            "profiles": Profile.objects.count(),
            "special_dates": SpecialDates.objects.count(),
            "tasks": Task.objects.count(),
            "friendships": Friendship.objects.count(),
            "assessments": Assessment.objects.count(),
        }

        self.seed_fixture_data()
        self.assert_fixture_counts_unchanged(initial_counts)

    def test_fixture_relations_resolve_by_same_user_natural_keys(self):
        """Test fixture relations resolve by same user natural keys."""
        self.seed_fixture_data()

        task = Task.objects.get(user__username="david", title="AKC Weeks 2-5")
        self.assertEqual(list(task.categories.values_list("text", flat=True)), ["Uni"])
        self.assertEqual(task.categories.get().user.username, "david")

        grade = Grade.objects.get(user__username="david", name="DBS")
        self.assertEqual(grade.category.text, "Uni")
        self.assertEqual(grade.category.user.username, "david")

    def test_fixture_seeders_preserve_profile_preference_and_assessment_values(self):
        """Test fixture seeders preserve profile preference and assessment values."""
        self.seed_fixture_data()

        preference = Preference.objects.get(user__username="thomas")
        self.assertEqual(preference.timezone, "Europe/London")
        self.assertEqual(
            set(preference.days_off.values_list("day", flat=True)), {1, 2, 3}
        )

        profile = Profile.objects.get(user__username="thomas")
        self.assertEqual(profile.name, "Thomas Doe")

        assessment = Assessment.objects.get(user__username="thomas", title="PPA Exam")
        self.assertIsNotNone(assessment.linked_event)
        self.assertEqual(assessment.linked_event.user.username, "thomas")
        self.assertEqual(assessment.linked_event.title, "PPA Exam")

    def test_seed_methods_call_fixture_and_random_helpers(self):
        """Test seed methods call fixture and random helpers."""
        self.assert_seed_calls(
            CategorySeeder(),
            "_create_fixture_category",
            "_populate_random_category",
            200,
        )

        self.assert_seed_calls(
            EventSeeder(), "_create_fixture_event", "_populate_random_event", 750
        )
        self.assert_seed_calls(
            GradeSeeder(), "_create_fixture_grade", "_populate_random_grade", 200
        )
        self.assert_seed_calls(
            PreferenceSeeder(),
            "_create_fixture_preference",
            "_populate_random_preference",
            200,
        )
        self.assert_seed_calls(
            SpecialDatesSeeder(),
            "_create_fixture_special_date",
            "_populate_random_special_date",
            200,
        )
        self.assert_seed_calls(
            TaskSeeder(), "_create_fixture_task", "_populate_random_task", 750
        )
        self.assert_seed_calls(
            FriendshipSeeder(),
            "_create_fixture_friendship",
            "_populate_random_friendship",
            200,
        )
        self.assert_seed_calls(
            UserSeeder(), "_create_fixture_user", "_populate_random_user", 250
        )
        self.assert_seed_calls(
            ProfileSeeder(), "_create_fixture_profile", "_populate_random_profile", 200
        )

        seeder = AssessmentSeeder()
        with (
            patch.object(
                seeder, "_create_fixture_assessment_event"
            ) as event_fixture_mock,
            patch.object(
                seeder, "_create_fixture_assessment"
            ) as assessment_fixture_mock,
            patch.object(
                seeder, "_populate_random_assessment_event"
            ) as event_populate_mock,
            patch.object(
                seeder, "_populate_random_assessment"
            ) as assessment_populate_mock,
        ):
            seeder.seed()

        event_fixture_mock.assert_called_once_with()
        assessment_fixture_mock.assert_called_once_with()
        self.assertEqual(event_populate_mock.call_count, 200)
        self.assertEqual(assessment_populate_mock.call_count, 200)

    def test_fixture_seeders_print_errors_when_creation_fails(self):
        """Test fixture seeders print errors when creation fails."""
        cases = [
            (
                CategorySeeder(),
                "_create_fixture_category",
                "_create_category",
                category_seeder,
                "categories",
                "Error occurred while creating category: boom",
            ),
            (
                EventSeeder(),
                "_create_fixture_event",
                "_create_event",
                event_seeder,
                "events",
                "Error occurred while creating event: boom",
            ),
            (
                GradeSeeder(),
                "_create_fixture_grade",
                "_create_grade",
                grade_seeder,
                "grades",
                "Error occurred while creating grade: boom",
            ),
            (
                PreferenceSeeder(),
                "_create_fixture_preference",
                "_create_preference",
                preference_seeder,
                "preferences",
                "Error occurred while creating preference: boom",
            ),
            (
                SpecialDatesSeeder(),
                "_create_fixture_special_date",
                "_create_special_date",
                special_dates_seeder,
                "special_dates",
                "Error occurred while creating special date: boom",
            ),
            (
                TaskSeeder(),
                "_create_fixture_task",
                "_create_task",
                task_seeder,
                "tasks",
                "Error occurred while creating task: boom",
            ),
            (
                FriendshipSeeder(),
                "_create_fixture_friendship",
                "_create_friendship",
                friendship_seeder,
                "friendships",
                "Error occurred while creating friendship: boom",
            ),
            (
                UserSeeder(),
                "_create_fixture_user",
                "_create_user",
                user_seeder,
                "users",
                "Error occurred while creating user: boom",
            ),
        ]

        for case in cases:
            self._assert_fixture_creation_error(*case)

        assessment_cases = [
            (
                AssessmentSeeder(),
                "_create_fixture_assessment",
                "_create_assessment",
                assessment_seeder,
                "assessments",
                "Error creating assessment: boom",
            ),
            (
                AssessmentSeeder(),
                "_create_fixture_assessment_event",
                "_create_event",
                assessment_seeder,
                "assessment_events",
                "Error creating assessment event: boom",
            ),
        ]

        for case in assessment_cases:
            self._assert_fixture_creation_error(*case)

        seeder = ProfileSeeder()
        with (
            patch("profiles.management.commands.seeders.profile_seeder.profiles", [{}]),
            patch.object(seeder, "_create_profile", side_effect=Exception("boom")),
            patch("builtins.print") as print_mock,
        ):
            seeder._create_fixture_profile()

        print_mock.assert_called_once_with(
            "Error occurred while creating profile: boom"
        )

    def test_category_and_preference_seeders_cover_update_and_defaults(self):
        """Test category and preference seeders cover update and defaults."""
        user = get_user_model().objects.create_user(
            username="category-owner",
            email="category@example.com",
            password="password123",
        )
        seeder = CategorySeeder()

        seeder._create_category(
            {
                "fields": {
                    "user": user.id,
                    "text": "Uni",
                    "colour": "#123456",
                    "max_daily_study_time": 90,
                    "colour_override": False,
                }
            }
        )
        seeder._create_category(
            {
                "fields": {
                    "user": user.id,
                    "text": "Uni",
                    "colour": "#654321",
                    "max_daily_study_time": 120,
                    "colour_override": True,
                }
            }
        )

        category = Category.objects.get(user=user, text="Uni")
        self.assertEqual(Category.objects.filter(user=user, text="Uni").count(), 1)
        self.assertEqual(category.colour, "#654321")
        self.assertEqual(category.max_daily_study_time, 120)
        self.assertTrue(category.colour_override)

        DayOfWeekSeeder().seed()
        with (
            patch(
                "core.management.commands.seeders.preference_seeder.random.randint",
                return_value=2,
            ),
            patch(
                "core.management.commands.seeders.preference_seeder.random.sample",
                return_value=[1, 3],
            ),
        ):
            created = PreferenceSeeder()._create_preference(
                {
                    "fields": {
                        "user": user.id,
                        "day_start": time(hour=9),
                        "day_end": time(hour=17),
                    }
                }
            )

        preference = Preference.objects.get(user=user)
        self.assertTrue(created)
        self.assertEqual(preference.timezone, "Europe/London")
        self.assertEqual(preference.day_schedule, default_day_schedule())
        self.assertEqual(set(preference.days_off.values_list("day", flat=True)), {1, 3})

    def test_category_seeder_populates_existing_random_user(self):
        """Test category seeder populates existing random user."""
        user = get_user_model().objects.create_user(
            username="existing-category-user",
            email="existing-category@example.com",
            password="password123",
        )
        seeder = CategorySeeder()

        seeder._populate_random_category()

        category = Category.objects.get()
        self.assertEqual(category.user, user)
        self.assertIsNotNone(category.text)
        self.assertIsNotNone(category.colour)

    def test_category_seeder_creates_missing_random_user(self):
        """Test category seeder creates missing random user."""
        seeder = CategorySeeder()
        self.assertEqual(get_user_model().objects.count(), 0)

        seeder._populate_random_category()

        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(Category.objects.count(), 1)
