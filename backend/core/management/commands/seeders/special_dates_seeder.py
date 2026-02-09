"""Special Dates Seeder"""

from core.models import SpecialDates

from .fixtures.special_dates_fixtures import special_dates
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class SpecialDatesSeeder(BaseSeeder):
    help = "Handles seeding of special dates into the database."

    def seed(self):
        self._create_fixture_special_date()
        self._populate_random_special_date()

    def _create_fixture_special_date(self):
        for special_date in special_dates:
            try:
                self._create_special_date(special_date)
            except Exception:
                pass

    def _create_special_date(self, data):
        SpecialDates.objects.get_or_create(
            user=data["fields"]["user"],
            date=data["fields"]["date"],
            text=data["fields"]["text"],
        )

    def populate_random_special_date(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_special_date(
            {
                "fields": {
                    "user": temporary_user,
                    "date": self.faker.date(),
                    "text": self.faker.sentence(),
                }
            }
        )
