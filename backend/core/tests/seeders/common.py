"""Shared test helpers for core seeder tests."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.management.commands.seeders.assessment_seeder import AssessmentSeeder
from core.management.commands.seeders.category_seeder import CategorySeeder
from core.management.commands.seeders.commute_seeder import CommuteSeeder
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
    Commute,
    DayOfWeek,
    Event,
    Friendship,
    Grade,
    Preference,
    SpecialDates,
    Task,
)
from profiles.management.commands.seeders.profile_seeder import ProfileSeeder
from profiles.models import Profile


class SeederTestCase(TestCase):
    """Shared base test case for core seeder tests."""

    def assert_seed_calls(self, seeder, fixture_method, random_method, random_calls):
        """Assert seed calls."""
        from unittest.mock import patch

        with (
            patch.object(seeder, fixture_method) as fixture_mock,
            patch.object(seeder, random_method) as random_mock,
        ):
            seeder.seed()

        fixture_mock.assert_called_once_with()
        self.assertEqual(random_mock.call_count, random_calls)

    def seed_fixture_data(self):
        """Seed fixture data."""
        UserSeeder()._create_fixture_user()
        CategorySeeder()._create_fixture_category()
        CommuteSeeder()._create_fixture_commute()
        DayOfWeekSeeder().seed()
        EventSeeder()._create_fixture_event()
        GradeSeeder()._create_fixture_grade()
        PreferenceSeeder()._create_fixture_preference()
        ProfileSeeder()._create_fixture_profile()
        SpecialDatesSeeder()._create_fixture_special_date()
        TaskSeeder()._create_fixture_task()
        FriendshipSeeder()._create_fixture_friendship()
        AssessmentSeeder()._create_fixture_assessment_event()
        AssessmentSeeder()._create_fixture_assessment()

    def assert_fixture_counts_unchanged(self, initial_counts):
        """Assert fixture counts unchanged."""
        self.assertEqual(get_user_model().objects.count(), initial_counts["users"])
        self.assertEqual(Category.objects.count(), initial_counts["categories"])
        self.assertEqual(Commute.objects.count(), initial_counts["commutes"])
        self.assertEqual(DayOfWeek.objects.count(), initial_counts["days"])
        self.assertEqual(Event.objects.count(), initial_counts["events"])
        self.assertEqual(Grade.objects.count(), initial_counts["grades"])
        self.assertEqual(Preference.objects.count(), initial_counts["preferences"])
        self.assertEqual(Profile.objects.count(), initial_counts["profiles"])
        self.assertEqual(SpecialDates.objects.count(), initial_counts["special_dates"])
        self.assertEqual(Task.objects.count(), initial_counts["tasks"])
        self.assertEqual(Friendship.objects.count(), initial_counts["friendships"])
        self.assertEqual(Assessment.objects.count(), initial_counts["assessments"])
