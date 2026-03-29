from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase

from notifications.models import Notification

User = get_user_model()


class NotificationSignalTests(TestCase):
    """Test cases for notification signal."""
    def setUp(self):
        self.user = User.objects.create_user(
            username="signal-user",
            email="signal@example.com",
            password="password",
        )

    def test_new_notification_payload_uses_actual_unread_count(self):
        """Test new notification payload uses actual unread count."""
        first_notification = Notification.objects.create(
            recipient=self.user,
            title="Old",
            message="Old message",
        )
        Notification.objects.filter(id=first_notification.id).update(is_read=True)

        # Simulate stale cache state from another process.
        cache.set(f"notifications:unread_count:{self.user.id}", 5, timeout=3600)

        with (
            patch(
                "notifications.signals.notification_signal.notify_user"
            ) as mock_notify,
            patch(
                "notifications.signals.notification_signal.send_push_notification.delay"
            ),
        ):
            Notification.objects.create(
                recipient=self.user,
                title="New",
                message="New message",
            )

        self.assertTrue(mock_notify.called)
        _, payload = mock_notify.call_args[0]
        self.assertEqual(payload["type"], "new_notification")
        self.assertEqual(payload["unread_count"], 1)
