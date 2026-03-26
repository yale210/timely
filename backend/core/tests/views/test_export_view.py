"""Test cases for the export view"""
from datetime import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Event


class ExportViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        response = self.client.get("/api/export/")
        self.assertEqual(response.status_code, 401)

    def test_success_if_logged_in(self):
        self.client.login(username="testuser", password="password")
        response = self.client.get("/api/export/")
        self.assertEqual(response.status_code, 200)

    def test_export_empty_calendar(self):
        self.client.login(username="testuser", password="password")
        response = self.client.get("/api/export/")

        expected_file_content = (
            "BEGIN:VCALENDAR\n"
            "VERSION:2.0\n"
            "PRODID:TIMELY v1.0\n"
            "CALSCALE:GREGORIAN\n"
            "METHOD:PUBLISH\n"
            "END:VCALENDAR\n"
        )

        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )

    def test_export_one_event_only(self):
        self.client.login(username="testuser", password="password")

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event 1",
            location="Location Event 1",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
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
            "DTSTAMP:20260205T120548\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )

    def test_export_two_events(self):
        self.client.login(username="testuser", password="password")

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event 1",
            location="Location Event 1",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event 2",
            location="Location Event 2",
            start_time=timezone.make_aware(datetime(2026, 4, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 4, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
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
            "DTSTAMP:20260205T120548\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e2\n"
            "DTSTAMP:20260205T120548\n"
            "DTSTART;TZID=Europe/London:20260425T200000\n"
            "DTEND;TZID=Europe/London:20260425T210000\n"
            "SUMMARY:Title Event 2\n"
            "DESCRIPTION:Description Event 2\n"
            "LOCATION:Location Event 2\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertTrue(Event.objects.filter(title="Title Event 2").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )

    def test_export_r_rule_1(self):
        self.client.login(username="testuser", password="password")

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event 1",
            location="Location Event 1",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
            recurrence_interval=Event.RecurrenceInterval.DAILY,
            recurrence_end=None,
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
            "DTSTAMP:20260205T120548\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "RRULE:FREQ=DAILY;UNTIL=None\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )

    def test_export_r_rule_2(self):
        self.client.login(username="testuser", password="password")

        start = datetime.strptime("20260325T200000", "%Y%m%dT%H%M%S")
        end = datetime.strptime("20260325T210000", "%Y%m%dT%H%M%S")
        stamp = datetime.strptime("20260205T120548", "%Y%m%dT%H%M%S")
        start_aware = timezone.make_aware(start)
        end_aware = timezone.make_aware(end)
        stamp_aware = timezone.make_aware(stamp)

        rec_end = datetime.strptime("20260417T000000", "%Y%m%dT%H%M%S").date()

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event 1",
            location="Location Event 1",
            start_time=start_aware,
            end_time=end_aware,
            last_edited=stamp_aware,
            recurrence_interval=Event.RecurrenceInterval.DAILY,
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
            "DTSTAMP:20260205T120548\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "RRULE:FREQ=DAILY;UNTIL=20260417T000000\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )

    def test_export_r_rule_until(self):
        self.client.login(username="testuser", password="password")

        start = datetime.strptime("20260325T200000", "%Y%m%dT%H%M%S")
        end = datetime.strptime("20260325T210000", "%Y%m%dT%H%M%S")
        stamp = datetime.strptime("20260205T120548", "%Y%m%dT%H%M%S")
        start_aware = timezone.make_aware(start)
        end_aware = timezone.make_aware(end)
        stamp_aware = timezone.make_aware(stamp)
        rec_end = datetime.strptime("20260425T000000", "%Y%m%dT%H%M%S").date()

        Event.objects.create(
            user=self.user,
            title="Until Event",
            description="Until Desc",
            location="Until Loc",
            start_time=start_aware,
            end_time=end_aware,
            last_edited=stamp_aware,
            recurrence_interval=Event.RecurrenceInterval.WEEKLY,
            recurrence_end=rec_end,
        )

        response = self.client.get("/api/export/")
        content = response.content.decode("utf-8")

        self.assertIn("RRULE:FREQ=WEEKLY;UNTIL=20260425T000000", content)
