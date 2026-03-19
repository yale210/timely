"""Tests for the broadcast job list serializer."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_panel.serializers import BroadcastJobListSerializer
from notifications.models import BroadcastJob

User = get_user_model()


class BroadcastJobListSerializerTests(TestCase):
    """Test serialization of broadcast job summary data."""

    def test_serializes_summary_fields(self):
        """Verify the broadcast list serializer exposes summary fields."""
        sender = User.objects.create_user(
            username="adminsender",
            email="adminsender@example.com",
            password="password123",
        )
        job = BroadcastJob.objects.create(
            sender=sender,
            title="Feature rollout",
            message="The new feature is now live.",
            target=BroadcastJob.Target.STAFF,
            status=BroadcastJob.Status.PARTIAL,
            recipient_count=12,
            delivered_count=10,
            failed_count=2,
        )

        serializer = BroadcastJobListSerializer(job)

        self.assertEqual(
            set(serializer.data.keys()),
            {
                "id",
                "title",
                "target",
                "status",
                "recipient_count",
                "delivered_count",
                "failed_count",
                "sender",
                "sender_username",
                "queued_at",
                "completed_at",
            },
        )
        self.assertEqual(serializer.data["id"], job.id)
        self.assertEqual(serializer.data["title"], "Feature rollout")
        self.assertEqual(serializer.data["target"], BroadcastJob.Target.STAFF)
        self.assertEqual(serializer.data["status"], BroadcastJob.Status.PARTIAL)
        self.assertEqual(serializer.data["recipient_count"], 12)
        self.assertEqual(serializer.data["delivered_count"], 10)
        self.assertEqual(serializer.data["failed_count"], 2)
        self.assertEqual(serializer.data["sender"], sender.id)
        self.assertEqual(serializer.data["sender_username"], "adminsender")
