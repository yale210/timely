"""
Management command to unseed the database with initial data.
This calls the smaller individual seeder files.
python manage.py unseed
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model as User
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
)


class Command(BaseCommand):
    """Removes all objects from the database."""

    help = "Unseeds the database. This allows for a clean state for seeding."

    def handle(self, *args, **kwargs):
        """
        Deletes all objects from the database, unseeding it and allowing for a fresh seed.
        """

        count = User().objects.all().delete()[0]
        print(f"Deleted {count} users.")

        count = Category.objects.all().delete()[0]
        print(f"Deleted {count} categories.")

        count = Commute.objects.all().delete()[0]
        print(f"Deleted {count} commutes.")

        count = DayOfWeek.objects.all().delete()[0]
        print(f"Deleted {count} days of the week.")

        count = Event.objects.all().delete()[0]
        print(f"Deleted {count} event.")

        count = Task.objects.all().delete()[0]
        print(f"Deleted {count} tasks.")

        count = Grade.objects.all().delete()[0]
        print(f"Deleted {count} grades.")

        count = Preference.objects.all().delete()[0]
        print(f"Deleted {count} preferences.")

        count = Profile.objects.all().delete()[0]
        print(f"Deleted {count} profiles.")

        count = SpecialDates.objects.all().delete()[0]
        print(f"Deleted {count} special dates.")
