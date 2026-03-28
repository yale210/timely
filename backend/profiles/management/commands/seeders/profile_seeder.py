"""Seed profile records for local development and test data."""

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from core.management.commands.seeders.base import BaseSeeder
from profiles.models import Profile

from .fixtures.profile_fixtures import profiles


class ProfileSeeder(BaseSeeder):
    """Create profile fixtures and optional randomized profile data."""

    help = "Handles seeding of profiles into the database."

    def seed(self):
        """Seed the configured profile fixtures into the database."""
        self._create_fixture_profile()

        for i in range(200):
            self._populate_random_profile()

    def _create_fixture_profile(self):
        """Insert the static profile fixtures, skipping missing users."""
        for profile in profiles:
            try:
                self._create_profile(profile)
            except Exception as exception:
                print(f"Error occurred while creating profile: {exception}")

    def _create_profile(self, data):
        """Create a profile record for an existing user fixture entry."""
        temporary_user = self.resolve_user(data["fields"]["user"])
        if temporary_user is None:
            return

        creation_date = data["fields"]["creation_date"]
        if isinstance(creation_date, str):
            creation_date = parse_datetime(creation_date)
            if creation_date is not None and timezone.is_naive(creation_date):
                creation_date = timezone.make_aware(creation_date)

        Profile.objects.update_or_create(
            user=temporary_user,
            defaults={
                "name": data["fields"].get("name", temporary_user.username),
                "date_of_birth": data["fields"]["date_of_birth"],
                "creation_date": creation_date,
            },
        )

    def _populate_random_profile(self):
        """Create a randomized fallback profile for local seeding."""
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_profile(
            {
                "fields": {
                    "user": temporary_user.id,
                    "date_of_birth": self.faker.date(),
                    "creation_date": self.faker.date(),
                }
            }
        )
