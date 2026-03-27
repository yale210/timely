"""Tests for friendship viewset."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Friendship


class FriendshipViewSetTests(APITestCase):
    def setUp(self):
        self.sender = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )
        self.receiver = get_user_model().objects.create_user(
            username="testuser2", password="password123", email="test123@user.com"
        )

        self.url = reverse("friendship-list")

    def test_create_friendship_request(self):
        data = {
            "receiver": self.receiver.id,
        }
        self.client.force_authenticate(user=self.sender)
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Friendship.objects.count(), 1)

        friendship = Friendship.objects.first()
        self.assertEqual(friendship.sender, self.sender)
        self.assertEqual(friendship.receiver, self.receiver)
        self.assertEqual(friendship.state, Friendship.State.SENT)

    def test_accept_friendship_state(self):
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state=Friendship.State.SENT,
        )
        self.client.force_authenticate(user=self.receiver)
        url = reverse("friendship-accept-request", args=[friendship.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        friendship.refresh_from_db()
        self.assertEqual(friendship.state, Friendship.State.ACCEPTED)

    def test_decline_friendship_state(self):
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state=Friendship.State.SENT,
        )
        self.client.force_authenticate(user=self.receiver)
        url = reverse("friendship-decline-request", args=[friendship.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        friendship.refresh_from_db()
        self.assertEqual(friendship.state, Friendship.State.DECLINED)

    def test_sender_cannot_accept_own_request(self):
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state=Friendship.State.SENT,
        )

        self.client.force_authenticate(user=self.sender)
        url = reverse("friendship-accept-request", args=[friendship.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        friendship.refresh_from_db()
        self.assertEqual(friendship.state, Friendship.State.SENT)

    def test_sender_cannot_decline_own_request(self):
        friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            state=Friendship.State.SENT,
        )

        self.client.force_authenticate(user=self.sender)
        url = reverse("friendship-decline-request", args=[friendship.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_friend_themselves_fails(self):
        self.client.force_authenticate(user=self.sender)
        data = {"receiver": self.sender.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_friend_already_friends_fails(self):
        Friendship.objects.create(
            sender=self.sender, receiver=self.receiver, state=Friendship.State.ACCEPTED
        )
        self.client.force_authenticate(user=self.sender)
        data = {"receiver": self.receiver.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
