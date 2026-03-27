"""Assessment Seeder.

This module provides the `AssessmentSeeder` class, which handles the generation
of assessment-related data in the database. It includes logic for creating
fixtures and randomly generated assessments and associated events.
"""

import random

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.management.commands.seeders.base import BaseSeeder
from core.models import Assessment, Category, Event

from .fixtures.assessment_fixtures import assessment_events, assessments


class AssessmentSeeder(BaseSeeder):
    """Seeder for the Assessment model.

    This class orchestrates the seeding of assessments by loading predefined
    fixtures and generating a large set of random assessments linked to users
     and events.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of assessments into the database."

    def seed(self):
        """Execute the seeding logic for assessments.

        This method sequentially creates fixture-based assessment events,
        fixture-based assessments, and then populates a large number of
        randomly generated assessment events and assessments.
        """
        self._create_fixture_assessment_event()
        self._create_fixture_assessment()

        # Generate a baseline of random events that can be linked to assessments
        for _ in range(200):
            self._populate_random_assessment_event()

        # Generate random assessments and link them to existing events where possible
        for _ in range(200):
            self._populate_random_assessment()

    def _create_fixture_assessment(self):
        """Load and create assessment instances from predefined fixtures.

        Iterates through the `assessments` list imported from fixtures and
        attempts to create each record in the database.
        """
        for assessment in assessments:
            try:
                self._create_assessment(assessment)
            except Exception as exception:
                print(f"Error creating assessment: {exception}")

    def _create_fixture_assessment_event(self):
        """Load and create event instances intended for assessments from fixtures.

        Iterates through the `assessment_events` list imported from fixtures and
        attempts to create each event record in the database.
        """
        for event in assessment_events:
            try:
                self._create_event(event)
            except Exception as exception:
                print(f"Error creating assessment event: {exception}")

    def _populate_random_assessment(self):
        """Generate a single random assessment and persist it.

        This method selects a random user, creates one if none exist, and then
        constructs an assessment with randomized attributes (title, type,
        due date, weighting, etc.) and attempts to link it to an available
        event for that user.
        """
        temporary_user = self._get_or_create_random_user()
        self._create_assessment(
            {"fields": self._build_random_assessment_fields(temporary_user)}
        )

    @staticmethod
    def _random_assessment_type():
        """Choose a realistic assessment type for generated seed data.

        Returns:
            str: One of the supported assessment type values.
        """
        return random.choice(
            [
                "EXAM",
                "COURSEWORK",
                "FORMATIVE",
                "SUMMATIVE",
                "OTHER",
                "QUIZ",
                "PRESENTATION",
                "PRACTICAL",
            ]
        )

    @staticmethod
    def _get_random_unlinked_event(user):
        """Find a candidate event that can be linked to a generated assessment.

        Args:
            user (User): The user whose event pool should be searched.

        Returns:
            Event | None: An unlinked event for the user, or None when no
                suitable event exists.
        """
        return (
            Event.objects.filter(user=user, assessment__isnull=True)
            .order_by("?")
            .first()
        )

    def _build_random_assessment_fields(self, temporary_user):
        """Assemble seed payload fields for a generated assessment record.

        Args:
            temporary_user (User): The user that should own the generated data.

        Returns:
            dict: Assessment field values in the fixture format consumed by the
                create helpers.
        """
        return {
            "user": temporary_user.id,
            "title": self.faker.sentence(),
            "assessment_type": self._random_assessment_type(),
            "due_date": timezone.make_aware(self.faker.date_time()),
            "length_of_assessment": random.randint(1, 300),
            "weighting_of_assessment": random.randint(1, 100),
            "notes": self.faker.sentence(),
            "reminder_offset": random.randint(1, 100),
            "linked_event": self._get_random_unlinked_event(temporary_user),
        }

    def _populate_random_assessment_event(self):
        """Generate a single random event record to be used for assessments.

        Creates an event with a random user, random category, and randomized
        metadata such as title, description, and color.
        """
        start = timezone.make_aware(self.faker.date_time())
        user = self._get_or_create_random_user()
        self._create_event(
            {
                "fields": {
                    "user": user.id,
                    "categories": [self._get_or_create_random_category(user).id],
                    "title": self.faker.sentence(),
                    "description": self.faker.sentence(),
                    "location": self.faker.word(),
                    "start_time": start,
                    "end_time": start,
                    "recurrence_interval": None,
                    "recurrence_end": None,
                    "exception_dates": [],
                    "split_from_event": None,
                    "colour": self.faker.hex_color(),
                }
            }
        )

    def _create_assessment(self, data):
        """Create or get an Assessment record from data.

        Handles resolving the User and Event relationships before persisting
         the record.

        Args:
            data (dict): A dictionary containing assessment field data.

        """
        user = self.resolve_user(data["fields"]["user"])
        linked_event = self.resolve_event(data["fields"].get("linked_event"), user)

        Assessment.objects.update_or_create(
            user=user,
            title=data["fields"]["title"],
            due_date=data["fields"]["due_date"],
            defaults={
                "assessment_type": data["fields"]["assessment_type"],
                "length_of_assessment": data["fields"]["length_of_assessment"],
                "weighting_of_assessment": data["fields"]["weighting_of_assessment"],
                "notes": data["fields"]["notes"],
                "reminder_offset": data["fields"]["reminder_offset"],
                "linked_event": linked_event,
            },
        )

    def _create_event(self, data):
        """Create or get an Event record from data.

        Handles basic field mapping and category relation assignment.

        Args:
            data (dict): A dictionary containing event field data.

        """
        user = self.resolve_user(data["fields"]["user"])
        split_from_event = self.resolve_event(
            data["fields"].get("split_from_event"),
            user,
        )
        event, _ = Event.objects.update_or_create(
            user=user,
            title=data["fields"]["title"],
            start_time=data["fields"].get("start_time"),
            defaults={
                "description": data["fields"]["description"],
                "location": data["fields"]["location"],
                "colour": data["fields"]["colour"],
                "start_time": data["fields"].get("start_time"),
                "end_time": data["fields"].get("end_time"),
                "recurrence_interval": data["fields"]["recurrence_interval"],
                "recurrence_end": data["fields"]["recurrence_end"],
                "exception_dates": data["fields"]["exception_dates"],
                "split_from_event": split_from_event,
            },
        )

        event.categories.set(
            self.resolve_categories(data["fields"].get("categories", []), user)
        )

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
