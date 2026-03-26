"""Grade Seeder module.

This module provides the `GradeSeeder` class, which handles the generation
of grade-related data for users. It supports both fixture-based grades
and randomly generated grades to test academic performance tracking.
"""

import random
from core.models import Grade, Category
from .fixtures.grade_fixtures import grades
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class GradeSeeder(BaseSeeder):
    """Seeder for the Grade model.

    This class orchestrates the seeding of grades by loading predefined
    fixtures and generating a large set of random grade records assigned to
    users in the database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of grades into the database."

    def seed(self):
        """Execute the seeding logic for grades.

        This method first loads fixture grades and then generates
        a large set of randomized grade data for testing progress
        and analytics features.
        """
        self._create_fixture_grade()
        # Generate random grades across various users
        for _ in range(200):
            self._populate_random_grade()

    def _create_fixture_grade(self):
        """Load and create grade instances from predefined fixtures.

        Iterates through the `grades` list from fixtures and attempts
        to persist each record.
        """
        for grade in grades:
            try:
                self._create_grade(grade)
            except Exception as exception:
                print(f"Error occurred while creating grade: {exception}")

    def _create_grade(self, data):
        """Create or get a Grade record from raw data.

        Args:
            data (dict): A dictionary containing grade field metadata.

        """
        user = self.resolve_user(data["fields"]["user"])
        category = self.resolve_category(data["fields"].get("category"), user)

        Grade.objects.update_or_create(
            user=user,
            name=data["fields"]["name"],
            date_achieved=data["fields"]["date_achieved"],
            defaults={
                "category": category,
                "score": data["fields"]["score"],
                "total_possible": data["fields"]["total_possible"],
            },
        )

    def _populate_random_grade(self):
        """Generate a single random grade and assign it to a random user.

        Finds an existing user or creates a fallback user, then generates
        a grade with randomized scores, names, and completion dates.
        """
        User = get_user_model()
        # Fetch a random user from the database
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            # Create a fallback user if the database is empty
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        # Construct and persist the random grade
        self._create_grade(
            {
                "fields": {
                    "user": temporary_user.id,
                    "name": self.faker.sentence(),
                    "category": Category.objects.order_by("?").first().id,
                    "score": random.randint(0, 100),
                    "total_possible": 100,
                    "date_achieved": self.faker.date(),
                }
            }
        )
