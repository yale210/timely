"""Management command to unseed the database by removing all objects.

This module provides an `unseed` command that facilitates cleaning up the database
by deleting all records for core and profile related models. It is typically used
to reset the database state before running the `seed` command.

Example:
    $ python manage.py unseed

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
    SpecialDates,
    Friendship,
)
from profiles.models import Profile


class Command(BaseCommand):
    """Management command for unseeding the database.

    This class defines the logic for the `unseed` command, which iterates through
    the main application models and deletes all their instances from the database.

    Attributes:
        help (str): Short description of the command for the help output.

    """

    help = "Unseeds the database. This allows for a clean state for seeding."

    def handle(self, *args, **kwargs):
        """Execute the unseeding process.

        Calls the internal `_delete_objects` method to perform the deletion
        of all records from the database.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        """
        self._delete_objects()

    def _delete_objects(self):
        """Delete all records for the predefined set of models.

        This method identifies the models that need to be cleared, counts
        the existing records for reporting, and then deletes all instances.
        It handles both the custom User model and associated application models.
        """
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
        # Gather counts before deletion for informative feedback
        for model in models:
            counts.append((model, model.objects.count()))

        # Perform bulk deletion for each model
        for model, count in counts:
            model.objects.all().delete()
            print(f"Deleted {count} of {model.__name__}")
