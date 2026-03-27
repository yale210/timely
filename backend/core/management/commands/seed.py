"""Management command to seed the database with initial data.
This calls the smaller individual seeder files.
python manage.py seed
"""

from django.core.management.base import BaseCommand

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
from profiles.management.commands.seeders.profile_seeder import ProfileSeeder


class Command(BaseCommand):
    """Management command for seeding the database.

    This class defines the logic for the `seed` command, which iterates through
    a predefined list of seeder classes and executes their `seed()` methods.
    It ensures that all necessary core and profile related data is generated.

    Attributes:
        help (str): Short description of the command for the help output.

    """

    help = "Seeds the database by calling individual seeders."

    def handle(self, *args, **kwargs):
        """Execute the seeding process.

        Iterates through the list of seeder classes, instantiates each,
        and calls its `seed()` method to populate the database.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        """
        # List of all seeder classes to be executed in sequence
        # Order may be important for foreign key dependencies
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
            # Instantiate and run the seeder's logic
            seeder().seed()
            print(f"Finished seeding {seeder.__name__}... \n")
