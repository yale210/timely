from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_panel.services.broadcast_jobs import (
    create_broadcast_job,
    create_retry_broadcast_job,
    queue_broadcast_job,
)
from notifications.models import BroadcastAuditLog, BroadcastJob, BroadcastRecipient

User = get_user_model()


class BroadcastJobServiceTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@example.com",
        )
        self.staff_user = User.objects.create_user(
            username="staff",
            password="password",
            email="staff@example.com",
        )
        self.regular_user = User.objects.create_user(
            username="regular",
            password="password",
            email="regular@example.com",
        )
        self.staff_user.is_staff = True
        self.staff_user.save(update_fields=["is_staff"])

    def test_create_broadcast_job_creates_recipients_and_audit_log(self):
        broadcast = create_broadcast_job(
            sender=self.admin_user,
            title="Notice",
            message="Hello everyone",
            target=BroadcastJob.Target.ALL,
            user_ids=[],
            recipient_ids=[self.admin_user.id, self.staff_user.id],
        )

        self.assertEqual(broadcast.recipient_count, 2)
        self.assertEqual(
            broadcast.audience_snapshot,
            {
                "recipient_ids": [self.admin_user.id, self.staff_user.id],
                "recipient_count": 2,
            },
        )
        self.assertEqual(
            set(
                BroadcastRecipient.objects.filter(broadcast_job=broadcast).values_list(
                    "recipient_id",
                    flat=True,
                )
            ),
            {self.admin_user.id, self.staff_user.id},
        )
        self.assertTrue(
            BroadcastAuditLog.objects.filter(
                broadcast_job=broadcast,
                action=BroadcastAuditLog.Action.SEND,
            ).exists()
        )

    def test_create_retry_broadcast_job_uses_failed_recipients_only(self):
        broadcast = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Original",
            message="payload",
            target=BroadcastJob.Target.ALL,
            audience_filters={"target": "all"},
            audience_snapshot={
                "recipient_ids": [self.staff_user.id, self.regular_user.id],
                "recipient_count": 2,
            },
            recipient_count=2,
            status=BroadcastJob.Status.FAILED,
        )

        retry_job = create_retry_broadcast_job(
            sender=self.admin_user,
            broadcast=broadcast,
            failed_recipient_ids=[self.regular_user.id],
        )

        self.assertEqual(retry_job.target, BroadcastJob.Target.RETRY_FAILED)
        self.assertEqual(retry_job.retry_of_id, broadcast.id)
        self.assertEqual(retry_job.recipient_count, 1)
        self.assertEqual(
            list(
                BroadcastRecipient.objects.filter(broadcast_job=retry_job).values_list(
                    "recipient_id",
                    flat=True,
                )
            ),
            [self.regular_user.id],
        )
        self.assertTrue(
            BroadcastAuditLog.objects.filter(
                broadcast_job=retry_job,
                action=BroadcastAuditLog.Action.RETRY,
            ).exists()
        )

    @patch("admin_panel.services.broadcast_jobs.process_broadcast_job.delay")
    def test_queue_broadcast_job_updates_task_id(self, mock_delay):
        broadcast = BroadcastJob.objects.create(
            sender=self.admin_user,
            title="Queued",
            message="payload",
            target=BroadcastJob.Target.ALL,
        )
        mock_delay.return_value = SimpleNamespace(id="task-123")

        task = queue_broadcast_job(broadcast)

        broadcast.refresh_from_db()
        self.assertEqual(task.id, "task-123")
        self.assertEqual(broadcast.task_id, "task-123")
