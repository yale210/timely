from django.contrib.auth import get_user_model
from django.test import TestCase
from core.models import Friendship
from django.core.exceptions import ValidationError
from django.db import IntegrityError

# SENT = "SENT", "Sent"
# ACCEPTED = "ACCEPTED", "Accepted"
# DECLINED = "DECLINED", "Declined"


class FriendshipTests(TestCase):
    def setUp(self):
        self.sender = get_user_model().objects.create_user(
            username="thomas1231321", password="password123", email="thomas@test.com"
        )

        self.receiver = get_user_model().objects.create_user(
            username="testinguser223232",
            password="password123",
            email="testing3321313@email.com",
        )

    def test_friendship_can_be_created(self):
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        self.assertEqual(friendship.sender, self.sender)
        self.assertEqual(friendship.receiver, self.receiver)
        self.assertEqual(friendship.state, "SENT")

    def test_friendship_str(self):
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
        friendship = Friendship(
            sender=self.sender,
            receiver=self.sender,
            state="SENT",
        )

        with self.assertRaises(ValidationError):
            friendship.full_clean()

    def test_user_cannot_send_duplicate_friend_request(self):
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
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.decline_friend_request()
        self.assertEqual(friendship.state, "DECLINED")

    def test_accept_friend_request_changes_state(self):
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.accept_friend_request()
        self.assertEqual(friendship.state, "ACCEPTED")

    def test_send_request_cannot_friend_themselves(self):
        with self.assertRaises(ValidationError):
            Friendship.send_request(sender=self.sender, receiver=self.sender)

    def test_send_request_creates_new_friendship(self):
        friendship = Friendship.send_request(sender=self.sender, receiver=self.receiver)

        self.assertEqual(friendship.sender, self.sender)
        self.assertEqual(friendship.receiver, self.receiver)
        self.assertEqual(friendship.state, "SENT")

    def test_send_request_causes_error_if_request_already_sent(self):
        Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        # Send same request again
        with self.assertRaises(ValidationError):
            Friendship.send_request(sender=self.sender, receiver=self.receiver)

    def test_send_request_causes_error_if_users_are_already_friends(self):
        Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="ACCEPTED",
        )

        with self.assertRaises(ValidationError):
            Friendship.send_request(sender=self.sender, receiver=self.receiver)

    def test_send_request_resends_declined_request(self):
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
