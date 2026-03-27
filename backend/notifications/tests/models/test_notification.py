from django.contrib.auth import get_user_model
from django.test import TestCase

from notifications.models import Notification

User = get_user_model()


class NotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password"
        )
        self.sender = User.objects.create_user(
            username="sender", email="sender@example.com", password="password"
        )

    def test_notification_creation(self):
        notification = Notification.objects.create(
            recipient=self.user,
            sender=self.sender,
            title="Test Title",
            message="Test Message",
            notification_type=Notification.NotificationType.CALENDAR,
        )
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.sender, self.sender)
        self.assertEqual(notification.title, "Test Title")
        self.assertEqual(notification.message, "Test Message")
        self.assertEqual(
            notification.notification_type, Notification.NotificationType.CALENDAR
        )
        self.assertFalse(notification.is_read)
        self.assertIsNotNone(notification.timestamp)

    def test_notification_str(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title="A very long title that should be truncated",
            message="Test Message",
            notification_type=Notification.NotificationType.SYSTEM,
        )
        self.assertEqual(
            str(notification), "A very long title that should be truncated"[:50]
        )

    def test_cascade_delete_recipient(self):
        Notification.objects.create(
            recipient=self.user,
            title="Test Title",
            message="Test Message",
            notification_type=Notification.NotificationType.CALENDAR,
        )
        self.user.delete()
        self.assertEqual(Notification.objects.count(), 0)

    def test_sender_null_blank(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title="System Message",
            message="Test Message",
            notification_type=Notification.NotificationType.SYSTEM,
        )
        self.assertIsNone(notification.sender)
