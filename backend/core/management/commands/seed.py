"""
Management command to seed the database with initial data.
This calls the smaller individual seeder files.
python manage.py seed
"""

from django.core.management.base import BaseCommand
from core.management.commands.seeders.user_seeder import UserSeeder
from core.management.commands.seeders.category_seeder import CategorySeeder
from core.management.commands.seeders.commute_seeder import CommuteSeeder
from core.management.commands.seeders.day_of_week_seeder import DayOfWeekSeeder
from core.management.commands.seeders.event_seeder import EventSeeder
from core.management.commands.seeders.grade_seeder import GradeSeeder
from core.management.commands.seeders.preference_seeder import PreferenceSeeder
from profiles.management.commands.seeders.profile_seeder import ProfileSeeder
from core.management.commands.seeders.special_dates_seeder import SpecialDatesSeeder
from core.management.commands.seeders.task_seeder import TaskSeeder
from core.management.commands.seeders.friendship_seeder import FriendshipSeeder
from core.management.commands.seeders.assessment_seeder import AssessmentSeeder


class Command(BaseCommand):
    help = "Seeds the database by calling individual seeders."

    def handle(self, *args, **kwargs):
        seeders = [
            UserSeeder,
            CategorySeeder,
            CommuteSeeder,
            DayOfWeekSeeder,
            EventSeeder,
            GradeSeeder,
            PreferenceSeeder,
            ProfileSeeder,
            SpecialDatesSeeder,
            TaskSeeder,
            FriendshipSeeder,
            AssessmentSeeder,
        ]

        for seeder in seeders:
            print(f"Seeding {seeder.__name__}...\n")
            seeder().seed()
            print(f"Finished seeding {seeder.__name__}... \n")
