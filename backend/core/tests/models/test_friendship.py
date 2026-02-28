import datetime
from django.contrib.auth import get_user_model
from django.test import TestCase
from core.models import Friendship
from django.core.exceptions import ValidationError
from django.db import IntegrityError

#SENT = "SENT", "Sent"
#ACCEPTED = "ACCEPTED", "Accepted"
#DECLINED = "DECLINED", "Declined"


class FriendshipTests(TestCase):
    def setUp(self):
        self.sender = get_user_model().objects.create_user(
            username="thomas1231321", password="password123", email="thomas@test.com"
        )

        self.receiver = get_user_model().objects.create_user(
            username="testinguser223232", password="password123", email="testing3321313@email.com"
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
        
        self.assertEqual(str(friendship), f"User: {self.sender} sent a friend request to {self.receiver}. State: SENT")


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
        friendship =Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.decline_friend_request()
        self.assertEqual(friendship.state, "DECLINED")

    def test_accept_friend_request_changes_state(self):
        friendship =Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state="SENT",
        )

        friendship.accept_friend_request()
        self.assertEqual(friendship.state, "ACCEPTED")
