from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from notifications.models import Notification

User = get_user_model()


class NotificationViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password"
        )
        self.other_user = User.objects.create_user(
            username="otheruser", email="other@example.com", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.notification = Notification.objects.create(
            recipient=self.user,
            title="Test Notification",
            message="Test Message",
            notification_type=Notification.NotificationType.SYSTEM,
        )
        self.other_notification = Notification.objects.create(
            recipient=self.other_user,
            title="Other Notification",
            message="Other Message",
            notification_type=Notification.NotificationType.SYSTEM,
        )

    def test_list_notifications(self):
        url = reverse("notification-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Test Notification")

    def test_mark_read(self):
        url = reverse("notification-mark-read", kwargs={"pk": self.notification.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_unread(self):
        Notification.objects.filter(id=self.notification.id).update(is_read=True)
        url = reverse("notification-mark-unread", kwargs={"pk": self.notification.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertFalse(self.notification.is_read)

    def test_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user,
            title="Another Notification",
            message="Another Message",
            notification_type=Notification.NotificationType.SYSTEM,
        )
        url = reverse("notification-mark-all-read")
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Notification.objects.filter(recipient=self.user, is_read=False).count(), 0
        )

    def test_unread_count(self):
        url = reverse("notification-unread-count")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_filter_notifications_by_is_read(self):
        Notification.objects.filter(id=self.notification.id).update(is_read=True)
        url = reverse("notification-list")
        response = self.client.get(url, {"is_read": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_filter_notifications_by_type(self):
        Notification.objects.filter(id=self.notification.id).update(
            notification_type=Notification.NotificationType.CALENDAR
        )
        url = reverse("notification-list")
        response = self.client.get(url, {"notification_type": "CALENDAR"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_delete_all(self):
        url = reverse("notification-delete-all")
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 0)
        self.assertEqual(
            Notification.objects.filter(recipient=self.other_user).count(), 1
        )

    def test_unauthenticated_access(self):
        self.client.logout()
        url = reverse("notification-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
