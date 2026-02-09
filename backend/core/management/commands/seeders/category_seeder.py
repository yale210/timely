"""Category Seeder"""

import random
from core.models import Category
from core.management.commands.seeders.base import BaseSeeder
from .fixtures.category_fixtures import categories


class CategorySeeder(BaseSeeder):
    help = "Handles seeding of categories into the database."

    def seed(self):
        self._create_fixture_category()
        self._populate_random_category()

    def _create_fixture_category(self):
        for category in categories:
            try:
                self._create_category(category)
            except Exception:
                pass

    def _populate_random_category(self):
        word = self.faker.word()
        colour = self.faker.hex_color()
        self._create_category(
            {
                "pk": None,
                "fields": {
                    "text": word,
                    "colour": colour,
                    "max_daily_study_time": random.randint(0, 24),
                },
            }
        )

    def _create_category(self, data):
        Category.objects.get_or_create(
            id=data["pk"],
            text=data["fields"]["text"],
            colour=data["fields"].get("colour", None),
            max_daily_study_time=data["fields"].get("max_daily_study_time", None),
        )


# text = models.CharField(max_length=20, blank=False, null=False)
# colour = models.CharField(
#    max_length=10, blank=True, null=True
# )  # Store the hex code
# max_daily_study_time = models.PositiveSmallIntegerField(
#    validators=[MinValueValidator(0), MaxValueValidator(24)],
#    null=True,
#    blank=True,
# )
