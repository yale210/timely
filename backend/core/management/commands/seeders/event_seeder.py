"""Event Seeder"""

import random
import datetime
from datetime import timedelta
from core.models import Event, Category
from django.utils import timezone
from .fixtures.event_fixtures import events
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class EventSeeder(BaseSeeder):
    help = "Handles seeding of events into the database."

    def seed(self):
        self._create_fixture_event()
        for i in range(200):
            self._populate_random_event()

    def _create_fixture_event(self):
        for event in events:
            try:
                self._create_event(event)
            except Exception:
                pass

    def _create_event(self, data):
        temporary_event, _ = Event.objects.get_or_create(
            user=data["fields"]["user"],
            title=data["fields"]["title"],
            description=data["fields"]["description"],
            location=data["fields"]["location"],
            start_time=data["fields"]["start_time"],
            end_time=data["fields"]["end_time"],
            recurrence_interval=data["fields"]["recurrence_interval"],
            recurrence_end=data["fields"]["recurrence_end"],
        )

        categories = data["fields"]["categories"]
        if categories:
            temporary_event.categories.set(categories)

    def _populate_random_event(self):
        temporary_user = self._get_or_create_random_user()
        temporary_category = self._get_or_create_random_category(temporary_user)

        if random.randint(0, 1) == 1:
            self._create_recurring_event(
                {
                    "fields": {
                        "user": temporary_user,
                        "categories": [temporary_category],
                    }
                }
            )
        else:
            self._create_non_recurring_event(
                {
                    "fields": {
                        "user": temporary_user,
                        "categories": [temporary_category],
                    }
                }
            )

    def _get_or_create_random_category(self, user):
        temporary_category = Category.objects.filter(user=user).order_by("?").first()

        if temporary_category is None:
            temporary_category = Category.objects.create(
                user=user,
                text=self.faker.word(),
                colour=self.faker.hex_color(),
                max_daily_study_time=random.randint(1, 24),
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

    def _create_recurring_event(self, data):
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

    def _create_non_recurring_event(self, data):
        start = timezone.make_aware(self.faker.date_time())
        end = start + timedelta(random.randint(0, 60))

        self._create_event(
            {
                "fields": {
                    "user": data["fields"]["user"],
                    "categories": data["fields"]["categories"],
                    "title": self.faker.sentence(),
                    "description": self.faker.sentence(),
                    "location": self.faker.word(),
                    "start_time": start,
                    "end_time": end,
                    "recurrence_interval": None,
                    "recurrence_end": None,
                }
            }
        )

    def _random_time(self):
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)
