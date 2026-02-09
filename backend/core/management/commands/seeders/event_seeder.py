"""Event Seeder"""

import random
import datetime
import faker
from core.models import Event, Category

from .fixtures.event_fixtures import events
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class EventSeeder(BaseSeeder):
    help = "Handles seeding of events into the database."

    def seed(self):
        self._create_fixture_event()
        self._populate_random_event()

    def _create_fixture_event(self):
        for event in events:
            try:
                self._create_event(event)
            except Exception:
                pass

    def _create_event(self, data):
        Event.objects.get_or_create(
            user=data["fields"]["user"],
            event_category=data["fields"]["event_category"],
            time=data["fields"]["time"],
            date=data["fields"]["date"],
            recurring=data["fields"]["recurring"],
            recurring_start=data["fields"]["recurring_start"],
            recurring_end=data["fields"]["recurring_end"],
            recurring_interval=data["fields"]["recurring_interval"],
        )

    def _populate_random_event(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        temporary_category = (
            Category.objects.filter(user=temporary_user).order_by("?").first()
        )

        if temporary_category is None:
            temporary_category = Category.objects.create(
                user=temporary_user,
                text=self.faker.word(),
                colour=self.faker.hex_color(),
                max_daily_study_time=random.randint(1, 24),
            )

        self._create_event(
            {
                "fields": {
                    "user": temporary_user,
                    "event_category": temporary_category,
                    "time": self._random_time(),
                    "date": self.faker.date(),
                    "recurring": random.randint(0, 1) == 1,
                    "recurring_start": self.faker.date() if "recurring" == 1 else None,
                    "recurring_end": self.faker.date() if "recurring" == 1 else None,
                    "recurring_interval": random.choice(
                        ["daily", "weekly", "monthly", "yearly"]
                    )
                    if "recurring" == 1
                    else None,
                }
            }
        )

    def _random_time(self):
        hours = random.randint(0, 23)
        minutes = random.randint(0, 59)
        return datetime.time(hour=hours, minute=minutes)
