"""Task Seeder"""

import random
from core.models import Task, Category

from .fixtures.task_fixtures import tasks
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder
from django.utils import timezone


class TaskSeeder(BaseSeeder):
    help = "Handles seeding of tasks into the database."

    def seed(self):
        self._create_fixture_task()
        for i in range(200):
            self._populate_random_task()

    def _create_fixture_task(self):
        for task in tasks:
            try:
                self._create_task(task)
            except Exception:
                pass

    def _create_task(self, data):
        temporary_task, _ = Task.objects.get_or_create(
            user=data["fields"]["user"],
            title=data["fields"]["title"],
            description=data["fields"]["description"],
            estimated_minutes=data["fields"]["estimated_minutes"],
            start_time=data["fields"]["start_time"],
            deadline=data["fields"]["deadline"],
            completed=data["fields"]["completed"],
            parent_task=data["fields"]["parent_task"],
            total_task_allocations=data["fields"]["total_task_allocations"],
            allocation=data["fields"]["allocation"],
            importance=data["fields"]["importance"],
        )

        categories = data["fields"]["categories"]
        if categories:
            temporary_task.categories.set(categories)

    def _populate_random_task(self):
        temporary_user = self._get_or_create_random_user()
        temporary_category = self._get_or_create_random_category(temporary_user)
        self._create_task(
            {
                "fields": {
                    "user": temporary_user,
                    "title": self.faker.sentence(),
                    "description": self.faker.sentence(),
                    "categories": [temporary_category],
                    "estimated_minutes": random.randint(1, 60 * 24),
                    "start_time": timezone.make_aware(self.faker.date_time()),
                    "deadline": timezone.make_aware(self.faker.date_time()),
                    "completed": random.randint(0, 1) == 1,
                    "parent_task": Task.objects.order_by("?").first()
                    if Task.objects.exists() and random.randint(0, 3) == 1
                    else None,
                    "total_task_allocations": random.randint(0, 24),
                    "allocation": None,
                    "importance": random.randint(1, 10),
                }
            }
        )

    def _get_or_create_random_user(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )
        return temporary_user

    def _get_or_create_random_category(self, user):
        temporary_category = Category.objects.filter(user=user).order_by("?").first()

        if temporary_category is None:
            temporary_category = Category.objects.create(
                user=user,
                text=self.faker.word(),
                colour=self.faker.hex_color(),
                max_daily_study_time=random.randint(1, 24),
            )
        return temporary_category
