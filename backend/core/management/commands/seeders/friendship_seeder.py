"""Friendship Seeder module.

This module provides the `FriendshipSeeder` class, which handles the generation
of friendship-related data, including connection requests and accepted
friendships. It facilitates testing the social and networking aspects of the
application.
"""

import random

from django.contrib.auth import get_user_model
from django.db.models import Q

from core.management.commands.seeders.base import BaseSeeder
from core.models import Friendship

from .fixtures.friendship_fixtures import friendships


class FriendshipSeeder(BaseSeeder):
    """Seeder for the Friendship model.

    This class orchestrates the seeding of friendships by loading predefined
    fixtures and generating a large set of random friendship requests and
    connections assigned to users in the database.

    Attributes:
        help (str): Description of the seeder's purpose.

    """

    help = "Handles seeding of friendships into the database."

    def seed(self):
        """Execute the seeding logic for friendships.

        This method first loads fixture friendships and then generates
        a large set of randomized friendship data to test social interaction
        scenarios.
        """
        self._create_fixture_friendship()
        # Generate random friendships across various users
        for _ in range(200):
            self._populate_random_friendship()

    def _create_fixture_friendship(self):
        """Load and create friendship instances from predefined fixtures.

        Iterates through the `friendships` list from fixtures and attempts
        to persist each record.
        """
        for friendship in friendships:
            try:
                self._create_friendship(friendship)
            except Exception as exception:
                print(f"Error occurred while creating friendship: {exception}")

    def _create_friendship(self, data):
        """Create or get a Friendship record from raw data.

        Handles resolving user relationships and ensuring that reciprocal
        requests do not create duplicates.

        Args:
            data (dict): A dictionary containing friendship metadata.

        Returns:
            Friendship: The created or existing Friendship instance.

        """
        sender = self.resolve_user(data["fields"]["sender"])
        receiver = self.resolve_user(data["fields"]["receiver"])

        # Check for existing friendship in either direction to maintain integrity
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
        """Generate a single random friendship connection.

        Selects two distinct random users and creates a friendship record
        between them with a randomized state.
        """
        # Fetch or create two distinct users
        temporary_sender, temporary_receiver = self._get_or_create_two_random_users()
        self._create_random_friendship(temporary_sender, temporary_receiver)

    def _create_random_friendship(self, temporary_sender, temporary_receiver):
        """Create a randomized friendship record between two users.

        Args:
            temporary_sender (User): The user sending the request.
            temporary_receiver (User): The user receiving the request.

        """
        Friendship.objects.update_or_create(
            sender=temporary_sender,
            receiver=temporary_receiver,
            defaults={
                "state": random.choice(["SENT", "ACCEPTED", "DECLINED"]),
            },
        )

    def _get_or_create_two_random_users(self):
        """Retrieve or create two distinct users for friendship generation.

        Returns:
            tuple: A pair of distinct User instances (sender, receiver).

        """
        User = get_user_model()
        # Randomly select the first user
        temporary_sender = User.objects.order_by("?").first()
        if temporary_sender is None:
            temporary_sender = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )
        # Select a second user, ensuring they are not the same as the first
        temporary_receiver = (
            User.objects.exclude(id=temporary_sender.id).order_by("?").first()
        )

        if temporary_receiver is None:
            # Create a second user if only one exists
            temporary_receiver = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )

        return temporary_sender, temporary_receiver
