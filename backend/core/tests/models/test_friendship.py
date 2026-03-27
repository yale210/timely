"""Tests for friendship."""

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from core.models import Friendship

# SENT = "SENT", "Sent"
# ACCEPTED = "ACCEPTED", "Accepted"
# DECLINED = "DECLINED", "Declined"


class FriendshipTests(TestCase):
    """Test cases for friendship."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.sender = get_user_model().objects.create_user(
            username="thomas1231321", password="password123", email="thomas@test.com"
        )

        self.receiver = get_user_model().objects.create_user(
            username="testinguser223232",
            password="password123",
            email="testing3321313@email.com",
        )

    def test_friendship_can_be_created(self):
        """Test friendship can be created."""
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        self.assertEqual(friendship.sender, self.sender)
        self.assertEqual(friendship.receiver, self.receiver)
        self.assertEqual(friendship.state, "SENT")

    def test_friendship_str(self):
        """Test friendship str."""
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        self.assertEqual(
            str(friendship),
            f"User: {self.sender} sent a friend request to {self.receiver}. State: SENT",
        )

    def test_user_cannot_friend_themselves(self):
        """Test user cannot friend themselves."""
        friendship = Friendship(
            sender=self.sender,
            receiver=self.sender,
            state="SENT",
        )

        with self.assertRaises(ValidationError):
            friendship.full_clean()

    def test_user_cannot_send_duplicate_friend_request(self):
        """Test user cannot send duplicate friend request."""
        friendship = Friendship(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.full_clean()
        friendship.save()

        with self.assertRaises(IntegrityError):
            duplicate = Friendship.objects.create(
                sender=self.sender,
                receiver=self.receiver,
                state="SENT",
            )

            duplicate.save()

    def test_decline_friend_request_changes_state(self):
        """Test decline friend request changes state."""
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.decline_friend_request()
        self.assertEqual(friendship.state, "DECLINED")

    def test_accept_friend_request_changes_state(self):
        """Test accept friend request changes state."""
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.accept_friend_request()
        self.assertEqual(friendship.state, "ACCEPTED")

    def test_send_request_cannot_friend_themselves(self):
        """Test send request cannot friend themselves."""
        with self.assertRaises(ValidationError):
            Friendship.send_request(sender=self.sender, receiver=self.sender)

    def test_send_request_creates_new_friendship(self):
        """Test send request creates new friendship."""
        friendship = Friendship.send_request(sender=self.sender, receiver=self.receiver)

        self.assertEqual(friendship.sender, self.sender)
        self.assertEqual(friendship.receiver, self.receiver)
        self.assertEqual(friendship.state, "SENT")

    def test_send_request_causes_error_if_request_already_sent(self):
        """Test send request causes error if request already sent."""
        Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        # Send same request again
        with self.assertRaises(ValidationError):
            Friendship.send_request(sender=self.sender, receiver=self.receiver)

    def test_send_request_causes_error_if_users_are_already_friends(self):
        """Test send request causes error if users are already friends."""
        Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="ACCEPTED",
        )

        with self.assertRaises(ValidationError):
            Friendship.send_request(sender=self.sender, receiver=self.receiver)

    def test_send_request_resends_declined_request(self):
        """Test send request resends declined request."""
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="DECLINED",
        )

        new_friendship = Friendship.send_request(
            sender=self.sender, receiver=self.receiver
        )
        self.assertEqual(new_friendship.state, "SENT")
        self.assertEqual(new_friendship.id, friendship.id)

    def test_send_request_after_decline_swaps_sender_receiver(self):
        """Test send request after decline swaps sender receiver."""
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="DECLINED",
        )

        new_friendship = Friendship.send_request(
            sender=self.receiver, receiver=self.sender
        )
        self.assertEqual(new_friendship.state, "SENT")
        self.assertEqual(new_friendship.id, friendship.id)
        self.assertEqual(new_friendship.sender, self.receiver)
        self.assertEqual(new_friendship.receiver, self.sender)
