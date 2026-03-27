from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import PushSubscription

User = get_user_model()


class PushSubscriptionViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="password", email="test@example.com"
        )
        self.client.force_authenticate(user=self.user)
        self.subscribe_url = reverse("push-subscribe")
        self.unsubscribe_url = reverse("push-unsubscribe")
        self.vapid_url = reverse("push-vapid-public-key")

    def test_subscribe_new(self):
        data = {"endpoint": "https://example.com/1", "p256dh": "dh1", "auth": "auth1"}
        response = self.client.post(self.subscribe_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            PushSubscription.objects.filter(endpoint="https://example.com/1").exists()
        )

    def test_subscribe_update(self):
        PushSubscription.objects.create(
            user=self.user, endpoint="https://example.com/1", p256dh="old", auth="old"
        )
        data = {"endpoint": "https://example.com/1", "p256dh": "new", "auth": "new"}
        response = self.client.post(self.subscribe_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sub = PushSubscription.objects.get(endpoint="https://example.com/1")
        self.assertEqual(sub.p256dh, "new")

    def test_subscribe_invalid(self):
        data = {"endpoint": ""}
        response = self.client.post(self.subscribe_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unsubscribe(self):
        PushSubscription.objects.create(
            user=self.user, endpoint="https://example.com/1", p256dh="dh1", auth="auth1"
        )
        data = {"endpoint": "https://example.com/1"}
        response = self.client.post(self.unsubscribe_url, data)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            PushSubscription.objects.filter(endpoint="https://example.com/1").exists()
        )

    def test_unsubscribe_no_endpoint(self):
        response = self.client.post(self.unsubscribe_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(VAPID_PUBLIC_KEY="test-public-key")
    def test_vapid_public_key(self):
        self.client.logout()
        response = self.client.get(self.vapid_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("public_key", response.data)
        self.assertEqual(response.data["public_key"], "test-public-key")

    @override_settings(VAPID_PUBLIC_KEY=None)
    def test_vapid_public_key_not_configured(self):
        self.client.logout()
        response = self.client.get(self.vapid_url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("error", response.data)
