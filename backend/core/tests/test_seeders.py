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


class SeederTests(TestCase):
    def seed_fixture_data(self):
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

    def test_fixture_seeders_are_idempotent(self):
        self.seed_fixture_data()
        initial_counts = {
            "users": get_user_model().objects.count(),
            "categories": Category.objects.count(),
            "commutes": Commute.objects.count(),
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

    def test_fixture_relations_resolve_by_same_user_natural_keys(self):
        self.seed_fixture_data()

        task = Task.objects.get(user__username="david", title="AKC Weeks 2-5")
        self.assertEqual(list(task.categories.values_list("text", flat=True)), ["Uni"])
        self.assertEqual(task.categories.get().user.username, "david")

        grade = Grade.objects.get(user__username="david", name="DBS")
        self.assertEqual(grade.category.text, "Uni")
        self.assertEqual(grade.category.user.username, "david")

    def test_fixture_seeders_preserve_profile_preference_and_assessment_values(self):
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
