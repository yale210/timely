"""A single scenario test for the export view, simulating a realistic export request"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Event

from datetime import datetime

from django.utils import timezone



# This will aim to create a "realistic" export calendar to export
# This export file will also be larger than other tests
class RealisitcExportViewTests(TestCase):
    """Test cases for realisitc export view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_success_if_logged_in(self):
        """Test success if logged in."""
        self.client.login(username="testuser", password="password")

        self.assertEqual(Event.objects.count(), 0)

        rec_end = datetime.strptime("20260827T000000", "%Y%m%dT%H%M%S").date()
        Event.objects.create(
            user=self.user,
            title="Module 1 Lecture",
            description="This is a module.",
            location="University",
            start_time=timezone.make_aware(datetime(2026, 3, 22, 9, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 22, 11, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 2 Lecture",
            description="This is a module.",
            location="University",
            start_time=timezone.make_aware(datetime(2026, 3, 23, 9, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 23, 11, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 3 Lecture",
            description="This is a module.",
            location="University",
            start_time=timezone.make_aware(datetime(2026, 3, 24, 9, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 24, 11, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 4 Lecture",
            description="This is a module.",
            location="University",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 9, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 11, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 1 SGT",
            description="This is a SGT.",
            location="University Building 2",
            start_time=timezone.make_aware(datetime(2026, 3, 22, 13, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 22, 14, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 2 SGT",
            description="This is a SGT.",
            location="University Building 2",
            start_time=timezone.make_aware(datetime(2026, 3, 23, 13, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 23, 14, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 3 SGT",
            description="This is a SGT.",
            location="University Building 2",
            start_time=timezone.make_aware(datetime(2026, 3, 24, 13, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 24, 14, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )
        Event.objects.create(
            user=self.user,
            title="Module 4 SGT",
            description="This is a SGT.",
            location="University Building 2",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 13, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 14, 0)),
            last_edited=timezone.make_aware(datetime(2026, 3, 27, 19, 47, 47)),
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )

        response = self.client.get("/api/export/")

        expected_file_content = (
            "BEGIN:VCALENDAR\n"
            "VERSION:2.0\n"
            "PRODID:TIMELY v1.0\n"
            "CALSCALE:GREGORIAN\n"
            "METHOD:PUBLISH\n"
            "BEGIN:VEVENT\n"
            "UID:e1\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260322T090000\n"
            "DTEND;TZID=Europe/London:20260322T110000\n"
            "SUMMARY:Module 1 Lecture\n"
            "DESCRIPTION:This is a module.\n"
            "LOCATION:University\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e2\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260323T090000\n"
            "DTEND;TZID=Europe/London:20260323T110000\n"
            "SUMMARY:Module 2 Lecture\n"
            "DESCRIPTION:This is a module.\n"
            "LOCATION:University\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e3\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260324T090000\n"
            "DTEND;TZID=Europe/London:20260324T110000\n"
            "SUMMARY:Module 3 Lecture\n"
            "DESCRIPTION:This is a module.\n"
            "LOCATION:University\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e4\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260325T090000\n"
            "DTEND;TZID=Europe/London:20260325T110000\n"
            "SUMMARY:Module 4 Lecture\n"
            "DESCRIPTION:This is a module.\n"
            "LOCATION:University\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e5\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260322T130000\n"
            "DTEND;TZID=Europe/London:20260322T140000\n"
            "SUMMARY:Module 1 SGT\n"
            "DESCRIPTION:This is a SGT.\n"
            "LOCATION:University Building 2\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e6\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260323T130000\n"
            "DTEND;TZID=Europe/London:20260323T140000\n"
            "SUMMARY:Module 2 SGT\n"
            "DESCRIPTION:This is a SGT.\n"
            "LOCATION:University Building 2\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e7\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260324T130000\n"
            "DTEND;TZID=Europe/London:20260324T140000\n"
            "SUMMARY:Module 3 SGT\n"
            "DESCRIPTION:This is a SGT.\n"
            "LOCATION:University Building 2\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e8\n"
            "DTSTAMP:20260327T194747Z\n"
            "DTSTART;TZID=Europe/London:20260325T130000\n"
            "DTEND;TZID=Europe/London:20260325T140000\n"
            "SUMMARY:Module 4 SGT\n"
            "DESCRIPTION:This is a SGT.\n"
            "LOCATION:University Building 2\n"
            "RRULE:FREQ=WEEKLY;UNTIL=20260827T000000Z\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )
        self.assertEqual(Event.objects.count(), 8)
        self.assertTrue(Event.objects.filter(title="Module 1 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 2 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 3 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 4 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 1 SGT").exists())
        self.assertTrue(Event.objects.filter(title="Module 2 SGT").exists())
        self.assertTrue(Event.objects.filter(title="Module 3 SGT").exists())
        self.assertTrue(Event.objects.filter(title="Module 4 SGT").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )
