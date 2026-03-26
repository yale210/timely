"""Category Seeder module.

This module provides the `CategorySeeder` class, which handles the generation
of category-related data for users. It supports both fixture-based categories
and randomly generated categories for development testing.
"""

from core.models import Category
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder
from .fixtures.category_fixtures import categories


class CategorySeeder(BaseSeeder):
    """Seeder for the Category model.

    This class orchestrates the seeding of categories by loading predefined
    fixtures and generating a large set of random categories assigned to
    users in the database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of categories into the database."

    def seed(self):
        """Execute the seeding logic for categories.

        This method first loads fixture categories and then generates
        a large set of randomized categories for testing user-specific
        organization patterns.
        """
        self._create_fixture_category()
        # Generate random categories across various users
        for _ in range(200):
            self._populate_random_category()

    def _create_fixture_category(self):
        """Load and create category instances from predefined fixtures.

        Iterates through the `categories` list from fixtures and attempts
        to persist each record.
        """
        for category in categories:
            try:
                self._create_category(category)
            except Exception as exception:
                print(f"Error occurred while creating category: {exception}")

    def _populate_random_category(self):
        """Generate a single random category and assign it to a random user.

        Finds an existing user or creates a fallback user, then generates
        a category with a random name and hex color.
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

        # Construct and persist the random category
        self._create_category(
            {
                "fields": {
                    "user": temporary_user.id,
                    "text": self.faker.word(),
                    "colour": self.faker.hex_color(),
                },
            }
        )

    def _create_category(self, data):
        """Create or get a Category record from raw data.

        Args:
            data (dict): A dictionary containing category primary key, user ID,
                and field metadata.

        """
        
        user = self.resolve_user(data["fields"]["user"])
        Category.objects.update_or_create(
            user=user,
            text=data["fields"]["text"],
            defaults={
                "colour": data["fields"].get("colour"),
                "max_daily_study_time": data["fields"].get("max_daily_study_time"),
                "colour_override": data["fields"].get("colour_override", False),
            },
        )
