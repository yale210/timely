from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Event

#tEST

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
            start_time="20260325T200000",
            end_time="20260325T210000",
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
            "DTSTAMP:20260205T120548Z\n"
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
            start_time="20260325T200000",
            end_time="20260325T210000",
        )

        Event.objects.create(
            user=self.user,
            title="Title Event 2",
            description="Description Event 2",
            location="Location Event 2",
            start_time="20260425T200000",
            end_time="20260425T210000",
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
            "DTSTAMP:20260205T120548Z\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "END:VEVENT\n"
            "BEGIN:VEVENT\n"
            "UID:e2\n"
            "DTSTAMP:20260205T120548Z\n"
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
            start_time="20260325T200000",
            end_time="20260325T210000",
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
            "DTSTAMP:20260205T120548Z\n"
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

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event 1",
            location="Location Event 1",
            start_time="20260325T200000",
            end_time="20260325T210000",
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
            "DTSTAMP:20260205T120548Z\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "RRULE:FREQ=DAILY;COUNT=5\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )

    def test_export_r_rule_3(self):

        self.client.login(username="testuser", password="password")

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event 1",
            location="Location Event 1",
            start_time="20260325T200000",
            end_time="20260325T210000",
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
            "DTSTAMP:20260205T120548Z\n"
            "DTSTART;TZID=Europe/London:20260325T200000\n"
            "DTEND;TZID=Europe/London:20260325T210000\n"
            "SUMMARY:Title Event 1\n"
            "DESCRIPTION:Description Event 1\n"
            "LOCATION:Location Event 1\n"
            "RRULE:FREQ=DAILY;INTERVAL=2\n"
            "END:VEVENT\n"
            "END:VCALENDAR\n"
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())
        self.assertEqual(
            response.content.decode("utf-8").strip(), expected_file_content.strip()
        )
