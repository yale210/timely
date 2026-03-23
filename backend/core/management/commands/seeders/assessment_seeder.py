"""Assessment Seeder"""

import random
from core.models import Assessment, Event, Category
from .fixtures.assessment_fixtures import assessments, assessment_events
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder
from django.utils import timezone
from datetime import timedelta


class AssessmentSeeder(BaseSeeder):
    help = "Handles seeding of assessments into the database."

    def seed(self):
        self._create_fixture_assessment_event()
        self._create_fixture_assessment()

        for i in range(200):
            self._populate_random_assessment_event()

        for i in range(200):
            self._populate_random_assessment()

    def _create_fixture_assessment(self):
        for assessment in assessments:
            try:
                self._create_assessment(assessment)
            except Exception as exception:
                print(f"Error creating assessment: {exception}")

    def _create_fixture_assessment_event(self):
        for event in assessment_events:
            try:
                self._create_event(event)
            except Exception as exception:
                print(f"Error creating assessment event: {exception}")

    def _populate_random_assessment(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()
        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_assessment(
            {
                "fields": {
                    "user": temporary_user.id,
                    "title": self.faker.sentence(),
                    "module": self.faker.word(),
                    "assessment_type": random.choice(
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
                    ),
                    "due_date": timezone.make_aware(self.faker.date_time()),
                    "start_time": timezone.make_aware(self.faker.date_time()),
                    "end_time": timezone.make_aware(self.faker.date_time()),
                    "length_of_assessment": random.randint(1, 300),
                    "weighting_of_assessment": random.randint(1, 100),
                    "notes": self.faker.sentence(),
                    "reminder_offset": random.randint(1, 100),
                    "linked_event": Event.objects.filter(
                        user=temporary_user, assessment__isnull=True
                    )
                    .order_by("?")
                    .first(),
                }
            }
        )

    def _populate_random_assessment_event(self):
        start = timezone.make_aware(self.faker.date_time())
        end = start + timedelta(minutes=random.randint(1, 60))

        self._create_event(
            {
                "fields": {
                    "user": self._get_or_create_random_user().id,
                    "categories": [
                        self._get_or_create_random_category(
                            self._get_or_create_random_user()
                        ).id
                    ],
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

    def _create_assessment(self, data):
        user = get_user_model().objects.get(id=data["fields"]["user"])
        linked_event = data["fields"].get("linked_event")
        if linked_event is not None and not hasattr(linked_event, "id"):
            linked_event = Event.objects.filter(id=linked_event).first()

        Assessment.objects.get_or_create(
            user=user,
            start_time=data["fields"]["start_time"],
            end_time=data["fields"]["end_time"],
            title=data["fields"]["title"],
            module=data["fields"]["module"],
            assessment_type=data["fields"]["assessment_type"],
            due_date=data["fields"]["due_date"],
            length_of_assessment=data["fields"]["length_of_assessment"],
            weighting_of_assessment=data["fields"]["weighting_of_assessment"],
            notes=data["fields"]["notes"],
            reminder_offset=data["fields"]["reminder_offset"],
            linked_event=linked_event,
        )

    def _create_event(self, data):
        user = get_user_model().objects.get(id=data["fields"]["user"])
        event, _ = Event.objects.get_or_create(
            user=user,
            title=data["fields"]["title"],
            description=data["fields"]["description"],
            location=data["fields"]["location"],
            colour=data["fields"]["colour"],
            start_time=data["fields"]["start_time"],
            end_time=data["fields"]["end_time"],
            recurrence_interval=data["fields"]["recurrence_interval"],
            recurrence_end=data["fields"]["recurrence_end"],
            exception_dates=data["fields"]["exception_dates"],
            split_from_event=data["fields"]["split_from_event"],
        )

        event.categories.set(
            Category.objects.filter(id__in=data["fields"].get("categories", []))
        )

    def _get_or_create_random_category(self, user):
        temporary_category = Category.objects.filter(user=user).order_by("?").first()

        if temporary_category is None:
            temporary_category = Category.objects.create(
                user=user,
                text=self.faker.word(),
                colour=self.faker.hex_color(),
            )
        return temporary_category

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
