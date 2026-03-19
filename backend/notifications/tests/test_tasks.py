from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from core.models.event import Event
from core.models.event_override import EventOverride
from core.models.event_reminder import EventReminder
from core.models.reminder_dispatch_log import ReminderDispatchLog
from notifications.models import Notification, PushSubscription
from notifications.tasks import (
    check_reminders,
    send_push_notification,
    cleanup_old_notifications,
    broadcast_notification,
)
from unittest.mock import patch


User = get_user_model()


class TasksTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="password", email="test@example.com"
        )
        self.other_user = User.objects.create_user(
            username="otheruser", password="password", email="other@example.com"
        )
        self.event = Event.objects.create(
            user=self.user,
            title="Test Event",
            start_time=timezone.now() + timezone.timedelta(hours=1),
            end_time=timezone.now() + timezone.timedelta(hours=2),
        )

    def test_check_reminders(self):
        reminder = EventReminder.objects.create(
            event=self.event, minutes_before=0, send_push=False
        )
        EventReminder.objects.filter(id=reminder.id).update(
            trigger_at=timezone.now() - timezone.timedelta(minutes=1)
        )

        EventReminder.objects.filter(id=reminder.id).update(
            trigger_at=timezone.now() - timezone.timedelta(minutes=1)
        )

        # Manually set trigger_at to past to ensure it's picked up
        EventReminder.objects.filter(id=reminder.id).update(
            trigger_at=timezone.now() - timezone.timedelta(minutes=1)
        )
        check_reminders()

        reminder.refresh_from_db()
        self.assertTrue(reminder.processed)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user, title__contains="Test Event"
            ).exists()
        )

    def test_check_reminders_no_push(self):
        reminder = EventReminder.objects.create(
            event=self.event, minutes_before=0, send_push=False
        )
        EventReminder.objects.filter(id=reminder.id).update(
            trigger_at=timezone.now() - timezone.timedelta(minutes=1)
        )
        with patch("notifications.tasks.Notification.save", autospec=True) as mock_save:
            check_reminders()
            self.assertTrue(mock_save.called)
            saved_instance = mock_save.call_args[0][0]
            self.assertTrue(getattr(saved_instance, "_skip_push", False))

    def test_check_recurring_reminders_dispatches_once_with_dedupe(self):
        recurring_start = timezone.now() - timezone.timedelta(seconds=10)
        recurring_event = Event.objects.create(
            user=self.user,
            title="Recurring Reminder",
            start_time=recurring_start,
            end_time=recurring_start + timezone.timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(recurring_start + timezone.timedelta(days=1)).date(),
        )
        EventReminder.objects.create(
            event=recurring_event,
            minutes_before=0,
            send_push=False,
        )

        check_reminders()
        first_count = Notification.objects.filter(
            recipient=self.user,
            title__contains="Recurring Reminder",
        ).count()
        self.assertEqual(first_count, 1)
        self.assertEqual(ReminderDispatchLog.objects.count(), 1)

        check_reminders()
        second_count = Notification.objects.filter(
            recipient=self.user,
            title__contains="Recurring Reminder",
        ).count()
        self.assertEqual(second_count, 1)
        self.assertEqual(ReminderDispatchLog.objects.count(), 1)

    def test_check_recurring_reminders_skips_exception_date(self):
        recurring_start = timezone.now() - timezone.timedelta(seconds=10)
        recurring_event = Event.objects.create(
            user=self.user,
            title="Recurring Skipped",
            start_time=recurring_start,
            end_time=recurring_start + timezone.timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(recurring_start + timezone.timedelta(days=1)).date(),
            exception_dates=[recurring_start.date().isoformat()],
        )
        EventReminder.objects.create(
            event=recurring_event,
            minutes_before=0,
            send_push=False,
        )

        check_reminders()
        self.assertFalse(
            Notification.objects.filter(
                recipient=self.user,
                title__contains="Recurring Skipped",
            ).exists()
        )
        self.assertEqual(ReminderDispatchLog.objects.count(), 0)

    def test_check_recurring_reminders_uses_override_snapshot(self):
        recurring_start = timezone.now() - timezone.timedelta(days=1, seconds=10)
        original_start = recurring_start + timezone.timedelta(days=1)
        recurring_event = Event.objects.create(
            user=self.user,
            title="Base Title",
            start_time=recurring_start,
            end_time=recurring_start + timezone.timedelta(hours=1),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=(recurring_start + timezone.timedelta(days=2)).date(),
            exception_dates=[original_start.date().isoformat()],
        )
        EventReminder.objects.create(
            event=recurring_event,
            minutes_before=30,
            send_push=False,
        )
        EventOverride.objects.create(
            parent_event=recurring_event,
            title="Override Title",
            description="",
            location="",
            start_time=original_start,
            end_time=original_start + timezone.timedelta(hours=1),
            original_start_time=original_start,
            reminders_snapshot=[
                {"minutes_before": 0, "send_push": False, "send_email": False}
            ],
        )

        check_reminders()
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user,
                title__contains="Override Title",
            ).exists()
        )

    @patch("notifications.tasks.webpush")
    def test_send_push_notification(self, mock_webpush):
        PushSubscription.objects.create(
            user=self.user, endpoint="https://example.com", p256dh="p256dh", auth="auth"
        )
        send_push_notification(self.user.id, "Title", "Message")
        self.assertTrue(mock_webpush.called)

    @patch("notifications.tasks.webpush")
    def test_send_push_notification_error(self, mock_webpush):
        from pywebpush import WebPushException

        class MockResponse:
            def __init__(self, status_code):
                self.status_code = status_code
                self.text = "Error"

        mock_webpush.side_effect = WebPushException("Error", response=MockResponse(410))

        sub = PushSubscription.objects.create(
            user=self.user, endpoint="https://example.com", p256dh="p256dh", auth="auth"
        )
        send_push_notification(self.user.id, "Title", "Message")
        self.assertFalse(PushSubscription.objects.filter(id=sub.id).exists())

    def test_cleanup_old_notifications(self):
        old_notification = Notification.objects.create(
            recipient=self.user, title="Old", message="Old message"
        )
        # Manually set timestamp
        Notification.objects.filter(id=old_notification.id).update(
            timestamp=timezone.now() - timezone.timedelta(days=31)
        )

        cleanup_old_notifications()
        self.assertFalse(Notification.objects.filter(id=old_notification.id).exists())

    def test_broadcast_notification_all(self):
        with patch(
            "notifications.tasks._send_push_notification_sync",
            return_value={"success": True, "error_code": "", "error_message": ""},
        ):
            with patch("notifications.tasks.notify_user") as mock_notify_user:
                result = broadcast_notification("Global", "Hello", target="all")

        self.assertEqual(result, "Broadcasted to 2 users")
        self.assertEqual(Notification.objects.filter(title="Global").count(), 2)
        self.assertEqual(
            Notification.objects.filter(
                title="Global",
                notification_type=Notification.NotificationType.SYSTEM,
            ).count(),
            2,
        )
        self.assertEqual(mock_notify_user.call_count, 2)

    def test_broadcast_notification_staff(self):
        staff_user = User.objects.create_user(
            username="staff",
            password="password",
            is_staff=True,
            email="staff@example.com",
        )
        broadcast_notification("Staff Only", "Hello", target="staff")
        self.assertTrue(
            Notification.objects.filter(
                recipient=staff_user, title="Staff Only"
            ).exists()
        )
        self.assertFalse(
            Notification.objects.filter(
                recipient=self.user, title="Staff Only"
            ).exists()
        )

    def test_broadcast_notification_users(self):
        broadcast_notification(
            "Users Only", "Hello", target="users", user_ids=[self.user.id]
        )
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.user, title="Users Only"
            ).exists()
        )

    def test_broadcast_notification_invalid(self):
        res = broadcast_notification("Title", "Message", target="invalid")
        self.assertEqual(res, "Invalid target")

    def test_broadcast_notification_admin(self):
        admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@example.com",
        )
        broadcast_notification("Admin Only", "Hello", target="admin")
        self.assertTrue(
            Notification.objects.filter(
                recipient=admin_user,
                title="Admin Only",
            ).exists()
        )

    def test_reminder_signature(self):
        from notifications.tasks import _reminder_signature
        reminder = {"minutes_before": 15, "send_email": True, "send_push": False}
        sig1 = _reminder_signature(reminder)
        sig2 = _reminder_signature({"minutes_before": "15", "send_email": True, "send_push": False})
        self.assertEqual(sig1, sig2)

    def test_record_dispatch_integrity_error(self):
        from notifications.tasks import _record_dispatch
        now = timezone.now()
        rem = {"minutes_before": 15}
        _record_dispatch(self.event, now, rem)
        # Try to create the same one again (IntegrityError due to unique constraint)
        success = _record_dispatch(self.event, now, rem)
        self.assertFalse(success)

    def test_send_push_notification_sync_no_subs(self):
        from notifications.tasks import _send_push_notification_sync
        res = _send_push_notification_sync(self.user.id, "T", "M")
        self.assertTrue(res["success"])

    @patch("notifications.tasks.webpush")
    def test_send_push_notification_sync_failure_all(self, mock_webpush):
        from pywebpush import WebPushException
        mock_webpush.side_effect = WebPushException("Fail")
        PushSubscription.objects.create(user=self.user, endpoint="E", p256dh="P", auth="A")
        from notifications.tasks import _send_push_notification_sync
        res = _send_push_notification_sync(self.user.id, "T", "M")
        self.assertFalse(res["success"])
        self.assertEqual(res["error_code"], "PUSH_PROVIDER_FAILURE")

    def test_process_broadcast_job_not_found(self):
        from notifications.tasks import process_broadcast_job
        self.assertEqual(process_broadcast_job(9999), "Broadcast not found")

    def test_process_broadcast_job_already_processed(self):
        from notifications.models import BroadcastJob
        from notifications.tasks import process_broadcast_job
        job = BroadcastJob.objects.create(
            sender=self.user, title="T", message="M", status=BroadcastJob.Status.COMPLETED,
            target="all", audience_filters={}, audience_snapshot={}, recipient_count=0
        )
        res = process_broadcast_job(job.id)
        self.assertIn("already processed", res)

    def test_process_broadcast_job_no_recipients(self):
        from notifications.models import BroadcastJob
        from notifications.tasks import process_broadcast_job
        job = BroadcastJob.objects.create(
            sender=self.user, title="T", message="M", status=BroadcastJob.Status.QUEUED,
            target="all", audience_filters={}, audience_snapshot={}, recipient_count=0
        )
        res = process_broadcast_job(job.id)
        self.assertEqual(res, "Broadcast has no recipients")
        job.refresh_from_db()
        self.assertEqual(job.status, BroadcastJob.Status.FAILED)

    def test_broadcast_notification_zero_audience(self):
        # target users with empty user_ids list
        res = broadcast_notification("T", "M", target="users", user_ids=[])
        self.assertEqual(res, "Broadcasted to 0 users")

    def test_process_due_reminders_invalid_minutes(self):
        from notifications.tasks import _process_due_reminders
        from unittest.mock import MagicMock
        now = timezone.now()
        expanded = MagicMock()
        expanded.reminders = [{"minutes_before": "invalid"}]
        # Should not crash, just continue
        _process_due_reminders(self.event, expanded, now, now - timezone.timedelta(minutes=1))

    def test_check_reminders_disabled_recurrence(self):
        from django.test import override_settings
        with override_settings(ENABLE_RECURRENCE_OVERRIDES=False):
            check_reminders()
            # Should return after processing non-recurring

    def test_send_push_notification_sync_success_with_error(self):
        # One sub succeeds, one fails
        from notifications.tasks import _send_push_notification_sync
        from pywebpush import WebPushException
        with patch("notifications.tasks.webpush") as mock_webpush:
            def side_effect(*args, **kwargs):
                if kwargs["subscription_info"]["endpoint"] == "fail":
                    raise WebPushException("Fail")
                return True
            mock_webpush.side_effect = side_effect
            PushSubscription.objects.create(user=self.user, endpoint="success", p256dh="P", auth="A")
            PushSubscription.objects.create(user=self.user, endpoint="fail", p256dh="P", auth="A")
            res = _send_push_notification_sync(self.user.id, "T", "M")
            self.assertTrue(res["success"])

    def test_process_broadcast_job_partial_and_failed(self):
        from notifications.models import BroadcastJob, BroadcastRecipient
        from notifications.tasks import process_broadcast_job
        # Case: Partial (some success, some fail)
        job = BroadcastJob.objects.create(
            sender=self.user, title="T", message="M", status=BroadcastJob.Status.QUEUED,
            target="all", audience_filters={}, audience_snapshot={}, recipient_count=2
        )
        BroadcastRecipient.objects.create(broadcast_job=job, recipient=self.user)
        BroadcastRecipient.objects.create(broadcast_job=job, recipient=self.other_user)
        
        with patch("notifications.tasks._send_push_notification_sync") as mock_push:
            mock_push.side_effect = [{"success": True}, {"success": False, "error_code": "E", "error_message": "M"}]
            process_broadcast_job(job.id)
            job.refresh_from_db()
            self.assertEqual(job.status, BroadcastJob.Status.PARTIAL)

        # Case: Failed (all fail)
        job2 = BroadcastJob.objects.create(
            sender=self.user, title="T", message="M", status=BroadcastJob.Status.QUEUED,
            target="all", audience_filters={}, audience_snapshot={}, recipient_count=1
        )
        BroadcastRecipient.objects.create(broadcast_job=job2, recipient=self.user)
        with patch("notifications.tasks._send_push_notification_sync") as mock_push:
            mock_push.return_value = {"success": False, "error_code": "E", "error_message": "M"}
            process_broadcast_job(job2.id)
            job2.refresh_from_db()
            self.assertEqual(job2.status, BroadcastJob.Status.FAILED)

    def test_build_broadcast_queryset_none(self):
        from notifications.tasks import _build_broadcast_queryset
        qs = _build_broadcast_queryset("invalid-target")
        self.assertEqual(qs.count(), 0)
