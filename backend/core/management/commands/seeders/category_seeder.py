"""Category Seeder"""

import random
from core.models import Category
from django.core.management.base import BaseSeeder
from .fixtures import categories


class CategorySeeder(BaseSeeder):
    help = "Handles seeding of categories into the database."

    def seed(self):
        for category in categories:
            try:
                self._create_category(category)
            except Exception:
                pass

    def populate_random_category(self):
        word = self.faker.word()
        colour = self.faker.hex_color()
        self._create_category(
            {
                "text": word,
                "colour": colour,
                "max_daily_study_time": random.randint(0, 24),
            }
        )

    def _create_category(self, data):
        Category.objects.get_or_create(
            id=data["id"],
            text=data["text"],
            colour=data.get("colour", None),
            max_daily_study_time=data.get("max_daily_study_time", None),
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
