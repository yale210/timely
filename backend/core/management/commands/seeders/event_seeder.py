"""Event Seeder module.

This module provides the `EventSeeder` class, which handles the generation
of event-related data, including both single and recurring events. It
facilitates testing the calendar and scheduling features of the application.
"""

import datetime
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.management.commands.seeders.base import BaseSeeder
from core.models import Category, Event

from .fixtures.event_fixtures import events


class EventSeeder(BaseSeeder):
    """Seeder for the Event model.

    This class orchestrates the seeding of events by loading predefined
    fixtures and generating a large set of random events (both one-off and
    recurring) assigned to users in the database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of events into the database."

    def seed(self):
        """Execute the seeding logic for events.

        This method first loads fixture events and then generates a large
        number of randomized events to test various calendar view scenarios.
        """
        self._create_fixture_event()
        # Generate random events across various users
        for _ in range(750):
            self._populate_random_event()

    def _create_fixture_event(self):
        """Load and create event instances from predefined fixtures.

        Iterates through the `events` list from fixtures and attempts
        to persist each record.
        """
        for event in events:
            try:
                self._create_event(event)
            except Exception as exception:
                print(f"Error occurred while creating event: {exception}")

    def _create_event(self, data):
        """Create or get an Event record from raw data.

        Handles basic field mapping, user resolution, and category relation
        assignment.

        Args:
            data (dict): A dictionary containing event field metadata.

        """
        user = self.resolve_user(data["fields"]["user"])
        split_from_event = self.resolve_event(
            data["fields"].get("split_from_event"),
            user,
        )

        temporary_event, _ = Event.objects.update_or_create(
            user=user,
            title=data["fields"]["title"],
            start_time=data["fields"]["start_time"],
            defaults={
                "description": data["fields"]["description"],
                "location": data["fields"]["location"],
                "end_time": data["fields"]["end_time"],
                "recurrence_interval": data["fields"]["recurrence_interval"],
                "recurrence_end": data["fields"]["recurrence_end"],
                "colour": data["fields"].get("colour"),
                "exception_dates": data["fields"].get("exception_dates", []),
                "split_from_event": split_from_event,
            },
        )

        categories = self.resolve_categories(data["fields"].get("categories", []), user)
        temporary_event.categories.set(categories)

    def _populate_random_event(self):
        """Generate a single random event and assign it to a random user.

        Determines whether to create a recurring or non-recurring event
        randomly.
        """
        # Delegate to randomized event type creation
        self._create_random_event_type()

    def _get_or_create_random_category(self, user):
        """Retrieve an existing random category or create one for the user.

        Args:
            user (User): The user for whom the category should be retrieved/created.

        Returns:
            Category: The resolved Category instance.

        """
        temporary_category = Category.objects.filter(user=user).order_by("?").first()

        if temporary_category is None:
            # Create a new category if the user doesn't have any
            temporary_category = Category.objects.create(
                user=user,
                text=self.faker.word(),
                colour=self.faker.hex_color(),
            )
        return temporary_category

    def _get_or_create_random_user(self):
        """Retrieve an existing random user or create a new one.

        Returns:
            User: The resolved User instance.

        """
        User = get_user_model()
        # Fetch a random user from the database
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            # Create a default user if none exist
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )
        return temporary_user

    def _create_recurring_event(self, data):
        """Generate a single random recurring event.

        Args:
            data (dict): A dictionary containing user and category metadata.

        """
        start = timezone.make_aware(self.faker.date_time())
        self._create_event(
            {
                "fields": {
                    "user": data["fields"]["user"],
                    "categories": data["fields"]["categories"],
                    "title": self.faker.sentence(),
                    "description": self.faker.sentence(),
                    "location": self.faker.word(),
                    "start_time": start,
                    "end_time": start + timedelta(random.randint(0, 100)),
                    "recurrence_interval": random.choice(
                        ["daily", "weekly", "monthly", "yearly"]
                    ),
                    "recurrence_end": (
                        start + timedelta(random.randint(0, 100))
                    ).date(),
                }
            }
        )

    def _create_random_event_type(self,data):
        """Determine and create either a recurring or single random event.

        Args:
            data (dict): A dictionary containing user and category metadata.

        """
        # Determine recurrence randomly
        recurring = random.randint(0, 1) == 1
        user = self._get_or_create_random_user()

        if recurring:
            start = timezone.make_aware(self.faker.date_time())
            self._create_event(
                {
                    "fields": {
                        "user": user.id,
                        "categories": [self._get_or_create_random_category(user).id],
                        "title": self.faker.sentence(),
                        "description": self.faker.sentence(),
                        "location": self.faker.word(),
                        "start_time": start,
                        "end_time": start + timedelta(random.randint(0, 100)),
                        "recurrence_interval": random.choice(
                            ["daily", "weekly", "monthly", "yearly"]
                        ),
                        "recurrence_end": (
                            start + timedelta(random.randint(0, 100))
                        ).date(),
                        "exception_dates": [],
                        "split_from_event": None,
                        "colour": self.faker.hex_color(),
                    }
                }
            )
        else:
            start = timezone.make_aware(self.faker.date_time())
            end = start + timedelta(random.randint(0, 60))

            self._create_event(
                {
                    "fields": {
                        "user": user.id,
                        "categories": [self._get_or_create_random_category(user).id],
                        "title": self.faker.sentence(),
                        "description": self.faker.sentence(),
                        "location": self.faker.word(),
                        "start_time": start,
                        "end_time": end,
                        "recurrence_interval": None,
                        "recurrence_end": None,
                        "exception_dates": [],
                        "split_from_event": None,
                        "colour": self.faker.hex_color(),
                    }
                }
            )

    def _random_time(self):
        """Generate a random `datetime.time` object.

        Returns:
            datetime.time: A randomly generated time.

        """
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)
