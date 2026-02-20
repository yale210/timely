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
            "notifications.tasks.Notification.objects.bulk_create",
            wraps=Notification.objects.bulk_create,
        ) as mock_bulk_create:
            with patch("notifications.tasks.notify_user") as mock_notify_user:
                with patch(
                    "notifications.tasks.send_push_notification.delay"
                ) as mock_send_push:
                    result = broadcast_notification("Global", "Hello", target="all")

        self.assertEqual(result, "Broadcasted to 2 users")
        self.assertEqual(Notification.objects.filter(title="Global").count(), 2)
        mock_bulk_create.assert_called_once()
        self.assertEqual(mock_notify_user.call_count, 2)
        self.assertEqual(mock_send_push.call_count, 2)

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

    def test_broadcast_notification_falls_back_to_unread_count_payload(self):
        mocked_notifications = [
            Notification(
                recipient_id=self.user.id,
                title="Users Only",
                message="Hello",
                notification_type=Notification.NotificationType.ADMIN,
            )
        ]
        with patch(
            "notifications.tasks.Notification.objects.bulk_create",
            return_value=mocked_notifications,
        ):
            with patch(
                "notifications.tasks.increment_unread_count", return_value=5
            ) as mock_increment_unread_count:
                with patch("notifications.tasks.notify_user") as mock_notify_user:
                    with patch(
                        "notifications.tasks.send_push_notification.delay"
                    ) as mock_send_push:
                        result = broadcast_notification(
                            "Users Only",
                            "Hello",
                            target="users",
                            user_ids=[self.user.id],
                        )

        self.assertEqual(result, "Broadcasted to 1 users")
        mock_increment_unread_count.assert_called_once_with(self.user.id, amount=1)
        mock_notify_user.assert_called_once_with(
            self.user.id, {"type": "unread_count", "count": 5}
        )
        mock_send_push.assert_called_once_with(self.user.id, "Users Only", "Hello")
