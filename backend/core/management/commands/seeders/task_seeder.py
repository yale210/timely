"""Seeder for Task models.

This module provides the TaskSeeder class, which handles populating the
database with both predefined fixture tasks and randomly generated tasks
for testing and demonstration purposes.
"""

import random
import datetime

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.management.commands.seeders.base import BaseSeeder
from core.models import Category, Task

from .fixtures.task_fixtures import tasks


class TaskSeeder(BaseSeeder):
    """Seeder class for the Task model.

    This seeder ensures that the database has a mix of specific fixture-based
    tasks and a larger set of randomized tasks associated with various users
    and categories.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of tasks into the database."

    def seed(self):
        """Execute the seeding process for tasks.

        First creates tasks from defined fixtures, then generates 200
        random tasks to provide a diverse dataset.
        """
        self._create_fixture_task()
        for i in range(750):
            self._populate_random_task()

    def _create_fixture_task(self):
        """Iterate through predefined task fixtures and create them.

        Logs an error message if a specific fixture fails to be created.
        """
        for task in tasks:
            try:
                self._create_task(task)
            except Exception as exception:
                print(f"Error occurred while creating task: {exception}")

    def _create_task(self, data):
        """Create or get a Task record from raw data.

        Handles parent task relationships and category assignments.

        Args:
            data (dict): A dictionary containing task field metadata, including
                user ID, title, timing, and category associations.

        """
        user = self.resolve_user(data["fields"]["user"])
        parent_task = self.resolve_task(data["fields"].get("parent_task"), user)

        temporary_task, _ = Task.objects.update_or_create(
            user=user,
            title=data["fields"]["title"],
            defaults={
                "description": data["fields"]["description"],
                "estimated_minutes": data["fields"]["estimated_minutes"],
                "start_time": data["fields"]["start_time"],
                "deadline": data["fields"]["deadline"],
                "completed": data["fields"]["completed"],
                "parent_task": parent_task,
                "total_task_allocations": data["fields"]["total_task_allocations"],
                "allocation": data["fields"]["allocation"],
                "importance": data["fields"]["importance"],
            },
        )

        categories = self.resolve_categories(data["fields"].get("categories", []), user)
        temporary_task.categories.set(categories)

    def _populate_random_task(self):
        """Generate and save a single task with randomized data.

        Ensures the task is associated with a user and a category, and
        potentially sets a random parent task.
        """
        temporary_user = self._get_or_create_random_user()
        temporary_category = self._get_or_create_random_category(temporary_user)
        start = self.faker.date_time()
        if timezone.is_naive(start):
            start = timezone.make_aware(start)
        self._create_task(
            {
                "fields": {
                    "user": temporary_user.id,
                    "title": self.faker.sentence(),
                    "description": self.faker.sentence(),
                    "categories": [temporary_category.id],
                    "estimated_minutes": random.randint(1, 60 * 24),
                    "start_time": start,
                    "deadline": start
                    + datetime.timedelta(minutes=random.randint(1, 60 * 24 * 10)),
                    "completed": random.randint(0, 1) == 1,
                    "parent_task": Task.objects.order_by("?").first().id
                    if Task.objects.exists() and random.randint(0, 3) == 1
                    else None,
                    "total_task_allocations": random.randint(0, 24),
                    "allocation": None,
                    "importance": random.randint(1, 10),
                }
            }
        )

    def _get_or_create_random_user(self):
        """Retrieve an existing random user or create a new one if none exist.

        Returns:
            User: A Django User model instance.

        """
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
        """Retrieve a random category for a user or create a new one.

        Args:
            user (User): The user for whom to find or create a category.

        Returns:
            Category: A Category model instance.

        """
        temporary_category = Category.objects.filter(user=user).order_by("?").first()

        if temporary_category is None:
            temporary_category = Category.objects.create(
                user=user,
                text=self.faker.word(),
                colour=self.faker.hex_color(),
            )
        return temporary_category
