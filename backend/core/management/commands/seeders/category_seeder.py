"""Category Seeder"""

from core.models import Category
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder
from .fixtures.category_fixtures import categories


class CategorySeeder(BaseSeeder):
    help = "Handles seeding of categories into the database."

    def seed(self):
        self._create_fixture_category()
        for i in range(200):
            self._populate_random_category()

    def _create_fixture_category(self):
        for category in categories:
            try:
                self._create_category(category)
            except Exception:
                pass

    def _populate_random_category(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_category(
            {
                "pk": None,
                "user": temporary_user,
                "fields": {
                    "text": self.faker.word(),
                    "colour": self.faker.hex_color(),
                },
            }
        )

    def _create_category(self, data):
        Category.objects.get_or_create(
            id=data["pk"],
            user=data["user"],
            text=data["fields"]["text"],
            colour=data["fields"].get("colour", None),
        )
