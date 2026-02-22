"""Friendship Seeder"""

import random
from core.models import Friendship

from .fixtures.friendship_fixtures import friendships
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class FriendshipSeeder(BaseSeeder):
    help = "Handles seeding of friendships into the database."

    def seed(self):
        self._create_fixture_friendship()
        self._populate_random_friendship()

    def _create_fixture_friendship(self):
        for friendship in friendships:
            try:
                self._create_friendship(friendship)
            except Exception:
                pass

    def _create_friendship(self, data):
        Friendship.objects.get_or_create(
            
        )

    def _populate_random_friendship(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        self._create_friendship(
            {
                "fields": {
                    
                }
            }
        )
