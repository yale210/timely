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

        User = get_user_model()

        user_count = User.objects.count()
        category_count = Category.objects.count()
        commute_count = Commute.objects.count()
        day_of_week_count = DayOfWeek.objects.count()
        event_count = Event.objects.count()
        task_count = Task.objects.count()
        grade_count = Grade.objects.count()
        preference_count = Preference.objects.count()
        profile_count = Profile.objects.count()
        special_date_count = SpecialDates.objects.count()
        friendship_count = Friendship.objects.count()

        User.objects.all().delete()
        print(f"Deleted {user_count} users.")

        Category.objects.all().delete()
        print(f"Deleted {category_count} categories.")

        Commute.objects.all().delete()
        print(f"Deleted {commute_count} commutes.")

        DayOfWeek.objects.all().delete()
        print(f"Deleted {day_of_week_count} days of the week.")

        Event.objects.all().delete()
        print(f"Deleted {event_count} event.")

        Task.objects.all().delete()
        print(f"Deleted {task_count} tasks.")

        Grade.objects.all().delete()
        print(f"Deleted {grade_count} grades.")

        Preference.objects.all().delete()
        print(f"Deleted {preference_count} preferences.")

        Profile.objects.all().delete()
        print(f"Deleted {profile_count} profiles.")

        SpecialDates.objects.all().delete()
        print(f"Deleted {special_date_count} special dates.")

        Friendship.objects.all().delete()
        print(f"Deleted {friendship_count} friendships.")
