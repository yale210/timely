"""
Management command to unseed the database with initial data.
This calls the smaller individual seeder files.
python manage.py unseed
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import (
    Category,
    Commute,
    DayOfWeek,
    Event,
    Task,
    Grade,
    Preference,
    Profile,
    SpecialDates,
    Friendship,
)


class Command(BaseCommand):
    """Removes all objects from the database."""

    help = "Unseeds the database. This allows for a clean state for seeding."

    def handle(self, *args, **kwargs):
        """
        Deletes all objects from the database, unseeding it and allowing for a fresh seed.
        """

        self._delete_objects()

    def _delete_objects(self):
        User = get_user_model()
        models = [
            User,
            Category,
            Commute,
            DayOfWeek,
            Event,
            Task,
            Grade,
            Preference,
            Profile,
            SpecialDates,
            Friendship,
        ]

        counts = []
        for model in models:
            counts.append((model, model.objects.count()))

        for model, count in counts:
            model.objects.all().delete()
            print(f"Deleted {count} of {model.__name__}")
