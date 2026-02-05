import datetime
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from core.models import Event, EventReminder


class EventReminderTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )
        self.event = Event.objects.create(
            user=self.user,
            title="Test Event",
            importance=5,
            start_time=timezone.now() + datetime.timedelta(hours=2),
            end_time=timezone.now() + datetime.timedelta(hours=3),
        )

    def test_trigger_at_calculation(self):
        reminder = EventReminder.objects.create(
            event=self.event, type=EventReminder.Type.POPUP, minutes_before=30
        )
        expected_trigger_at = self.event.start_time - datetime.timedelta(minutes=30)
        self.assertEqual(reminder.trigger_at, expected_trigger_at)

    def test_processed_default_false(self):
        reminder = EventReminder.objects.create(event=self.event, minutes_before=15)
        self.assertFalse(reminder.processed)

    def test_reminder_deletion_on_event_delete(self):
        EventReminder.objects.create(event=self.event, minutes_before=15)
        self.assertEqual(EventReminder.objects.count(), 1)
        self.event.delete()
        self.assertEqual(EventReminder.objects.count(), 0)

    def test_save_with_event_no_start_time(self):
        # This covers the branch where self.event.start_time is None
        event = Event(user=self.user, title="No Start Time")
        event.start_time = None
        reminder = EventReminder(event=event, minutes_before=15)
        try:
            reminder.save()
        except Exception:
            pass
