"""Task Seeder"""

import random
from core.models import Task
from .fixtures import tasks
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class TaskSeeder(BaseSeeder):
    help = "Handles seeding of tasks into the database."

    def seed(self):
        for task in tasks:
            try:
                self._create_task(task)
            except Exception:
                pass

    def _create_task(self, data):
        Task.objects.get_or_create(
            user=data["fields"]["user"],
            title=data["fields"]["title"],
            description=data["fields"]["description"],
            categories=data["fields"]["categories"],
            estimated_minutes=data["fields"]["estimated_minutes"],
            start_time=data["fields"]["start_time"],
            deadline=data["fields"]["deadline"],
            completed=data["fields"]["completed"],
            parent_task=data["fields"]["parent_task"],
            total_task_allocations=data["fields"]["total_task_allocations"],
            allocation=data["fields"]["allocation"],
            importance=data["fields"]["importance"],
        )

    def populate_random_task(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_task(
            {
                "fields": {
                    "user": temporary_user,
                    "title": self.faker.sentence(),
                    "description": self.faker.sentence(),
                    "categories": [],
                    "estimated_minutes": random.randint(1, 60 * 24),
                    "start_time": self.faker.datetime(),
                    "deadline": self.faker.datetime(),
                    "completed": random.randint(0, 1) == 1,
                    "parent_task": Task.objects.order_by("?").first()
                    if Task.objects.exists() and random.randint(0, 3) == 1
                    else None,
                    "total_task_allocations": random.randint(0, 24),
                    "allocation": [],
                    "importance": random.randint(1, 10),
                }
            }
        )
