from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from core.models.event import Event
from core.models.event_reminder import EventReminder
from core.models.notification import Notification
from core.models.push_subscription import PushSubscription
from core.tasks import (
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
        with patch("core.tasks.Notification.save", autospec=True) as mock_save:
            check_reminders()
            self.assertTrue(mock_save.called)
            saved_instance = mock_save.call_args[0][0]
            self.assertTrue(getattr(saved_instance, "_skip_push", False))

    @patch("core.tasks.webpush")
    def test_send_push_notification(self, mock_webpush):
        PushSubscription.objects.create(
            user=self.user, endpoint="https://example.com", p256dh="p256dh", auth="auth"
        )
        send_push_notification(self.user.id, "Title", "Message")
        self.assertTrue(mock_webpush.called)

    @patch("core.tasks.webpush")
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
        broadcast_notification("Global", "Hello", target="all")
        self.assertTrue(Notification.objects.filter(title="Global").exists())

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
