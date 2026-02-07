"""Special Dates Seeder"""

from core.models import SpecialDates
from .fixtures import special_dates
from django.contrib.auth import get_user_model
from django.core.management.base import BaseSeeder


class SpecialDatesSeeder(BaseSeeder):
    help = "Handles seeding of special dates into the database."

    def seed(self):
        for special_date in special_dates:
            try:
                self._create_special_date(special_date)
            except Exception:
                pass

    def _create_special_date(self, data):
        SpecialDates.objects.get_or_create(
            user=data["user"], date=data["date"], text=data["text"]
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
                "user": temporary_user,
                "date": self.faker.date(),
                "text": self.faker.sentence(),
            }
        )
