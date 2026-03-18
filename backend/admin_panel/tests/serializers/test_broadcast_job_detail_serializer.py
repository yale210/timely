"""Tests for the broadcast job detail serializer."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_panel.serializers import BroadcastJobDetailSerializer
from notifications.models import BroadcastJob, BroadcastRecipient

User = get_user_model()


class BroadcastJobDetailSerializerTests(TestCase):
    """Test serialization of detailed broadcast job data."""

    def setUp(self):
        """Create broadcast job fixtures for detail serializer tests."""
        self.sender = User.objects.create_user(
            username="broadcaster",
            email="broadcaster@example.com",
            password="password123",
        )
        self.first_recipient = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="password123",
        )
        self.second_recipient = User.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="password123",
        )
        self.retry_of = BroadcastJob.objects.create(
            sender=self.sender,
            title="Earlier broadcast",
            message="Old message",
            target=BroadcastJob.Target.ALL,
        )

    def test_serializes_detail_fields_and_nested_recipients(self):
        """Verify detail serialization includes nested recipients and metadata."""
        job = BroadcastJob.objects.create(
            sender=self.sender,
            title="Feature rollout",
            message="The new feature is now live.",
            target=BroadcastJob.Target.USERS,
            status=BroadcastJob.Status.COMPLETED,
            task_id="task-123",
            recipient_count=2,
            delivered_count=1,
            failed_count=1,
            audience_filters={
                "target": BroadcastJob.Target.USERS,
                "user_ids": [self.first_recipient.id, self.second_recipient.id],
            },
            audience_snapshot={
                "recipient_ids": [self.first_recipient.id, self.second_recipient.id],
                "recipient_count": 2,
            },
            provider_errors=[{"code": "PUSH_FAILED", "message": "Rejected"}],
            retry_of=self.retry_of,
        )
        BroadcastRecipient.objects.create(
            broadcast_job=job,
            recipient=self.first_recipient,
            status=BroadcastRecipient.DeliveryStatus.SENT,
        )
        BroadcastRecipient.objects.create(
            broadcast_job=job,
            recipient=self.second_recipient,
            status=BroadcastRecipient.DeliveryStatus.FAILED,
            error_code="PUSH_FAILED",
            error_message="Rejected",
        )

        serializer = BroadcastJobDetailSerializer(job)

        self.assertEqual(serializer.data["id"], job.id)
        self.assertEqual(serializer.data["title"], "Feature rollout")
        self.assertEqual(serializer.data["message"], "The new feature is now live.")
        self.assertEqual(serializer.data["target"], BroadcastJob.Target.USERS)
        self.assertEqual(serializer.data["status"], BroadcastJob.Status.COMPLETED)
        self.assertEqual(serializer.data["task_id"], "task-123")
        self.assertEqual(serializer.data["sender"], self.sender.id)
        self.assertEqual(serializer.data["sender_username"], "broadcaster")
        self.assertEqual(serializer.data["retry_of"], self.retry_of.id)
        self.assertEqual(serializer.data["audience_filters"]["target"], "users")
        self.assertEqual(serializer.data["audience_snapshot"]["recipient_count"], 2)
<<<<<<< HEAD
        self.assertEqual(serializer.data["provider_errors"][0]["code"], "PUSH_FAILED")
=======
        self.assertEqual(
            serializer.data["provider_errors"][0]["code"], "PUSH_FAILED"
        )
>>>>>>> 57c2cea (test: implement test cases for all views and serializers)
        self.assertEqual(len(serializer.data["recipients"]), 2)
        self.assertEqual(
            [recipient["username"] for recipient in serializer.data["recipients"]],
            ["alice", "bob"],
        )
