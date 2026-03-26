"""Test cases for the import view"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile


class ImportViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_success_if_logged_in(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertEqual(response.status_code, 200)

    def test_success_if_logged_in_r(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"RRULE:FREQ=DAILY;UNTIL=None\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertEqual(response.status_code, 200)

    def test_success_if_logged_in_r2(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"RRULE:FREQ=DAILY;UNTIL=20270417T000000\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertEqual(response.status_code, 200)

    def test_success_x2_no_change(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"RRULE:FREQ=DAILY;UNTIL=20270417T000000\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        importing_file_2 = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertEqual(response.status_code, 200)

        response = self.client.post("/api/import/", {"file": importing_file_2})

        self.assertContains(
            response,
            "0 Events were imported, but the file is correctly formatted. Check for duplicates?",
        )

    def test_failure_if_no_file(self):
        self.client.login(username="testuser", password="password")
        response = self.client.post("/api/import/", {})
        self.assertContains(response, "No file uploaded")

    def test_failure_if_wrong_file_type(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="application/pdf",
        )

        response = self.client.post("/api/import/", {"file": importing_file})
        self.assertContains(response, "File type is not .txt")

    def test_failure_if_empty_file(self):
        self.client.login(username="testuser", password="password")
        importing_file_content = (b"").strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "Empty file")

    def test_failure_if_no_begin(self):
        self.client.login(username="testuser", password="password")
        importing_file_content = (
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "File requires: BEGIN:VCALENDAR")

    def test_failure_if_no_end(self):
        self.client.login(username="testuser", password="password")
        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "File requires: END:VCALENDAR")

    def test_failure_if_begin_x2_before_end(self):
        self.client.login(username="testuser", password="password")
        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"BEGIN:VEVENT\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "Event indentation error")

    def test_failure_if_end_before_begin(self):
        self.client.login(username="testuser", password="password")
        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"END:VEVENT\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "No event to end")

    def test_failure_if_missing_summary(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "One or more events don't have a summary")

    def test_failure_if_missing_start(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "One or more events don't have a DTSTART")

    def test_failure_if_missing_end(self):
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTAMP:20260205T120548Z\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"SUMMARY:Title Event 1\n"
            b"DESCRIPTION:Description Event 1\n"
            b"LOCATION:Location Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "One or more events don't have a DTEND")
