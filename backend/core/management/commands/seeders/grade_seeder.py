"""Grade Seeder"""

import random
from core.models import Grade, Category

from .fixtures.grade_fixtures import grades
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class GradeSeeder(BaseSeeder):
    help = "Handles seeding of grades into the database."

    def seed(self):
        self._create_fixture_grade()
        #for i in range(200):
        #    self._populate_random_grade()

    def _create_fixture_grade(self):
        for grade in grades:
            try:
                self._create_grade(grade)
            except Exception as exception:
                print(f"Error occurred while creating grade: {exception}")

    def _create_grade(self, data):
        Grade.objects.get_or_create(
            user_id=data["fields"]["user"],
            name=data["fields"]["name"],
            category_id=data["fields"]["category"],
            score=data["fields"]["score"],
            total_possible=data["fields"]["total_possible"],
            date_achieved=data["fields"]["date_achieved"],
        )

    def _populate_random_grade(self):
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
                "fields": {
                    "user": temporary_user,
                    "name": self.faker.sentence(),
                    "category": Category.objects.order_by("?").first(),
                    "score": random.randint(0, 100),
                    "total_possible": 100,
                    "date_achieved": self.faker.date_time(),
                }
            }
        )
