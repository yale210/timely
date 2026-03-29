from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from notifications.models import BroadcastJob, BroadcastRecipient, Notification
from notifications.tasks.broadcast_delivery import (
    build_broadcast_websocket_payload,
    complete_broadcast_without_recipients,
    determine_broadcast_status,
    finalise_broadcast_delivery,
)

User = get_user_model()


class BroadcastDeliveryTests(TestCase):
    """Test cases for broadcast delivery."""
    def setUp(self):
        self.user = User.objects.create_user(
            username="recipient",
            password="password",
            email="recipient@example.com",
        )
        self.broadcast = BroadcastJob.objects.create(
            sender=None,
            title="Title",
            message="Message",
            target=BroadcastJob.Target.ALL,
            audience_filters={},
            audience_snapshot={},
            recipient_count=1,
            status=BroadcastJob.Status.QUEUED,
        )

    def test_determine_broadcast_status(self):
        """Test determine broadcast status."""
        self.assertEqual(
            determine_broadcast_status(delivered_count=2, failed_count=0),
            BroadcastJob.Status.COMPLETED,
        )
        self.assertEqual(
            determine_broadcast_status(delivered_count=0, failed_count=2),
            BroadcastJob.Status.FAILED,
        )
        self.assertEqual(
            determine_broadcast_status(delivered_count=1, failed_count=1),
            BroadcastJob.Status.PARTIAL,
        )

    def test_complete_broadcast_without_recipients_marks_failure(self):
        """Test complete broadcast without recipients marks failure."""
        complete_broadcast_without_recipients(self.broadcast)

        self.broadcast.refresh_from_db()
        self.assertEqual(self.broadcast.status, BroadcastJob.Status.FAILED)
        self.assertEqual(self.broadcast.delivered_count, 0)
        self.assertEqual(self.broadcast.failed_count, 0)
        self.assertEqual(
            self.broadcast.provider_errors,
            [{"code": "ZERO_AUDIENCE", "message": "Broadcast has no recipients."}],
        )
        self.assertIsNotNone(self.broadcast.completed_at)

    def test_build_broadcast_websocket_payload_uses_notification_data(self):
        """Test build broadcast websocket payload uses notification data."""
        notification = Notification.objects.create(
            recipient=self.user,
            title="Hello",
            message="World",
            notification_type=Notification.NotificationType.SYSTEM,
        )

        payload = build_broadcast_websocket_payload(
            notification=notification,
            sender_username="admin",
            unread_count=3,
        )

        self.assertEqual(payload["type"], "new_notification")
        self.assertEqual(payload["notification"]["id"], notification.id)
        self.assertEqual(payload["notification"]["sender_username"], "admin")
        self.assertEqual(payload["unread_count"], 3)

    def test_build_broadcast_websocket_payload_falls_back_without_notification(self):
        """Test build broadcast websocket payload falls back without notification."""
        payload = build_broadcast_websocket_payload(
            notification=None,
            sender_username=None,
            unread_count=4,
        )

        self.assertEqual(payload, {"type": "unread_count", "count": 4})

    def test_finalise_broadcast_delivery_updates_job_and_recipients(self):
        """Test finalise broadcast delivery updates job and recipients."""
        notification = Notification.objects.create(
            recipient=self.user,
            title="Done",
            message="Updated",
            notification_type=Notification.NotificationType.SYSTEM,
        )
        recipient = BroadcastRecipient.objects.create(
            broadcast_job=self.broadcast,
            recipient=self.user,
        )
        recipient.notification = notification
        recipient.status = BroadcastRecipient.DeliveryStatus.SENT
        recipient.error_code = ""
        recipient.error_message = ""
        recipient.last_attempt_at = timezone.now()

        finalise_broadcast_delivery(
            broadcast=self.broadcast,
            recipients=[recipient],
            delivered=1,
            failed=0,
            errors=[],
        )

        self.broadcast.refresh_from_db()
        recipient.refresh_from_db()
        self.assertEqual(self.broadcast.status, BroadcastJob.Status.COMPLETED)
        self.assertEqual(self.broadcast.delivered_count, 1)
        self.assertEqual(self.broadcast.failed_count, 0)
        self.assertEqual(recipient.status, BroadcastRecipient.DeliveryStatus.SENT)
        self.assertEqual(recipient.notification_id, notification.id)
