"""Base Seeder module.

This module defines the abstract base class for all seeder implementations.
It provides common utilities like the Faker instance for generating realistic
data in a consistent locale.
"""

from django.contrib.auth import get_user_model
from faker import Faker


class BaseSeeder:
    """The abstract base class for all database seeders.

    This class serves as a foundation for individual seeder classes, ensuring
    a consistent interface and providing shared resources such as data
    generation utilities.

    Attributes:
        faker (Faker): An instance of the Faker library configured for GB English
            locales to generate realistic mock data.

    """

    def __init__(self):
        """Initialize the seeder with a localized Faker instance."""
        self.faker = Faker("en_GB")

    def seed(self):
        """Execute the seeding logic.

        This method must be overridden by all concrete subclasses to implement
        their specific model-level seeding logic, such as loading fixtures
        or generating random records.

        Raises:
            NotImplementedError: If the subclass does not implement this method.

        """
        raise NotImplementedError("Subclass is not implementing the seed method.")

    def resolve_user(self, user_reference):
        """Resolve a user by model instance, username, or legacy ID."""
        if user_reference is None:
            return None
        if hasattr(user_reference, "pk"):
            return user_reference

        User = get_user_model()
        if isinstance(user_reference, int):
            return User.objects.get(id=user_reference)
        return User.objects.get(username=user_reference)

    def resolve_category(self, category_reference, user_reference=None):
        """Resolve a category by model instance, text, or legacy ID."""
        from core.models import Category

        if category_reference is None:
            return None
        if hasattr(category_reference, "pk"):
            return category_reference
        if isinstance(category_reference, int):
            return Category.objects.get(id=category_reference)

        if isinstance(category_reference, dict):
            category_text = category_reference["text"]
            user_reference = category_reference.get("user", user_reference)
        else:
            category_text = category_reference

        user = self.resolve_user(user_reference)
        return Category.objects.get(user=user, text=category_text)

    def resolve_categories(self, category_references, user_reference=None):
        """Resolve category references into model instances."""
        return [
            self.resolve_category(category_reference, user_reference)
            for category_reference in category_references
        ]

    def resolve_task(self, task_reference, user_reference=None):
        """Resolve a task by model instance, natural key, or legacy ID."""
        from core.models import Task

        if task_reference is None:
            return None
        if hasattr(task_reference, "pk"):
            return task_reference
        if isinstance(task_reference, int):
            return Task.objects.filter(id=task_reference).first()

        if isinstance(task_reference, dict):
            task_title = task_reference["title"]
            user_reference = task_reference.get("user", user_reference)
        else:
            task_title = task_reference

        user = self.resolve_user(user_reference)
        return Task.objects.filter(user=user, title=task_title).order_by("id").first()

    def resolve_event(self, event_reference, user_reference=None):
        """Resolve an event by model instance, natural key, or legacy ID."""
        from core.models import Event

        if event_reference is None:
            return None
        if hasattr(event_reference, "pk"):
            return event_reference
        if isinstance(event_reference, int):
            return Event.objects.filter(id=event_reference).first()

        if isinstance(event_reference, dict):
            lookup = {"title": event_reference["title"]}
            user_reference = event_reference.get("user", user_reference)
            if event_reference.get("start_time") is not None:
                lookup["start_time"] = event_reference["start_time"]
        else:
            lookup = {"title": event_reference}

        user = self.resolve_user(user_reference)
        return Event.objects.filter(user=user, **lookup).order_by("id").first()

    def resolve_days_of_week(self, day_references):
        """Resolve day-of-week references by day number or model instance."""
        from core.models import DayOfWeek

        resolved_days = []
        for day_reference in day_references:
            if hasattr(day_reference, "pk"):
                resolved_days.append(day_reference)
            else:
                resolved_days.append(DayOfWeek.objects.get(day=day_reference))
        return resolved_days
