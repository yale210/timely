"""Grade Seeder"""

import random
from core.models import Grade, Category
from .fixtures import grades
from django.contrib.auth import get_user_model
from core.management.base import BaseSeeder


class GradeSeeder(BaseSeeder):
    help = "Handles seeding of grades into the database."

    def seed(self):
        for grade in grades:
            try:
                self._create_grade(grade)
            except Exception:
                pass

    def _create_grade(self, data):
        Grade.objects.get_or_create(
            user=data["user"],
            name=data["name"],
            category=data["category"],
            score=data["score"],
            total_possible=data["total_possible"],
            date_achieved=data["date_achieved"],
        )

    def populate_random_grade(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_grade(
            {
                "user": temporary_user,
                "name": self.faker.sentence(),
                "category": Category.objects.order_by("?").first(),
                "score": random.randint(0, 100),
                "total_possible": 100,
                "date_achieved": self.faker.datetime(),
            }
        )
