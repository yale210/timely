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
            except Exception as e:
                pass

    def populate_random_category(self):
        word = self.faker.word()
        self._create_category({"text": word})


    def _create_category(self,data):
        Category.objects.get_or_create(
            id=data["id"],
            text=data["text"],
        )