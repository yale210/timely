"""Friendship Seeder"""

import random
from core.models import Friendship
from django.db.models import Q
from .fixtures.friendship_fixtures import friendships
from django.contrib.auth import get_user_model
from core.management.commands.seeders.base import BaseSeeder


class FriendshipSeeder(BaseSeeder):
    help = "Handles seeding of friendships into the database."

    def seed(self):
        self._create_fixture_friendship()
        for i in range(200):
            self._populate_random_friendship()

    def _create_fixture_friendship(self):
        for friendship in friendships:
            try:
                self._create_friendship(friendship)
            except Exception as exception:
                print(f"Error occurred while creating friendship: {exception}")

    def _create_friendship(self, data):
        sender = self.resolve_user(data["fields"]["sender"])
        receiver = self.resolve_user(data["fields"]["receiver"])

        # Check for existing friendship
        request_exists = (
            Friendship.objects.filter(
                Q(sender=sender, receiver=receiver)
                | Q(sender=receiver, receiver=sender)
            )
        ).first()

        if request_exists:
            if request_exists.sender == sender and request_exists.receiver == receiver:
                request_exists.state = data["fields"]["state"]
                request_exists.save(update_fields=["state"])
            return request_exists
        else:
            # No request existed so make one.
            return Friendship.objects.create(
                sender=sender,
                receiver=receiver,
                state=data["fields"]["state"],
            )

    def _populate_random_friendship(self):
        # Shuffle users and get a random user.
        temporary_sender, temporary_receiver = self._get_or_create_two_random_users()
        self._create_random_friendship(temporary_sender, temporary_receiver)

    def _create_random_friendship(self, temporary_sender, temporary_receiver):
        Friendship.objects.get_or_create(
            sender=temporary_sender,
            receiver=temporary_receiver,
            state=random.choice(["SENT", "ACCEPTED", "REJECTED"]),
        )

    def _get_or_create_two_random_users(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_sender = User.objects.order_by("?").first()
        if temporary_sender is None:
            temporary_sender = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )
        temporary_receiver = (
            User.objects.exclude(id=temporary_sender.id).order_by("?").first()
        )

        if temporary_receiver is None:
            temporary_receiver = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        return temporary_sender, temporary_receiver
