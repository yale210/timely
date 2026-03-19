"""Tests for the broadcast recipient serializer."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_panel.serializers import BroadcastRecipientSerializer
from notifications.models import BroadcastJob, BroadcastRecipient, Notification

User = get_user_model()


class BroadcastRecipientSerializerTests(TestCase):
    """Test serialization of broadcast recipient details."""

    def setUp(self):
        """Create recipient-related fixtures for serializer tests."""
        self.sender = User.objects.create_user(
            username="sender",
            email="sender@example.com",
            password="password123",
        )
        self.recipient_user = User.objects.create_user(
            username="recipient",
            email="recipient@example.com",
            password="password123",
        )
        self.broadcast = BroadcastJob.objects.create(
            sender=self.sender,
            title="System maintenance",
            message="Maintenance starts tonight.",
            target=BroadcastJob.Target.ALL,
        )
        self.notification = Notification.objects.create(
            recipient=self.recipient_user,
            sender=self.sender,
            title="Maintenance notice",
            message="Maintenance starts tonight.",
        )

    def test_serializes_related_recipient_fields(self):
        """Verify recipient serializer includes related user information."""
        recipient = BroadcastRecipient.objects.create(
            broadcast_job=self.broadcast,
            recipient=self.recipient_user,
            notification=self.notification,
            status=BroadcastRecipient.DeliveryStatus.FAILED,
            error_code="PUSH_FAILED",
            error_message="Endpoint rejected the request.",
        )

        serializer = BroadcastRecipientSerializer(recipient)

        self.assertEqual(serializer.data["id"], recipient.id)
        self.assertEqual(serializer.data["recipient"], self.recipient_user.id)
        self.assertEqual(serializer.data["username"], "recipient")
        self.assertEqual(serializer.data["email"], "recipient@example.com")
        self.assertEqual(
            serializer.data["status"], BroadcastRecipient.DeliveryStatus.FAILED
        )
        self.assertEqual(serializer.data["error_code"], "PUSH_FAILED")
        self.assertEqual(
            serializer.data["error_message"], "Endpoint rejected the request."
        )
        self.assertEqual(serializer.data["notification"], self.notification.id)
