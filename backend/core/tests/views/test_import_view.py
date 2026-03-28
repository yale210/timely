"""Test cases for the import view"""

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient


class ImportViewTests(TestCase):
    """Test cases for import view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_success_if_logged_in(self):
        """Test success if logged in."""
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
        """Test success if logged in r."""
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
        """Test success if logged in r2."""
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
        """Test success x2 no change."""
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
        """Test failure if no file."""
        self.client.login(username="testuser", password="password")
        response = self.client.post("/api/import/", {})
        self.assertContains(response, "No file uploaded", status_code=400)

    def test_failure_if_wrong_file_type(self):
        """Test failure if wrong file type."""
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
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="application/pdf",
        )

        response = self.client.post("/api/import/", {"file": importing_file})
        self.assertContains(response, "File type is not .txt", status_code=400)

    def test_failure_if_empty_file(self):
        """Test failure if empty file."""
        self.client.login(username="testuser", password="password")
        importing_file_content = (b"").strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "Empty file", status_code=400)

    def test_failure_if_no_begin(self):
        """Test failure if no begin."""
        self.client.login(username="testuser", password="password")
        importing_file_content = (
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "File requires: BEGIN:VCALENDAR", status_code=400)

    def test_failure_if_no_end(self):
        """Test failure if no end."""
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
            b"END:VEVENT\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "File requires: END:VCALENDAR", status_code=400)

    def test_failure_if_begin_x2_before_end(self):
        """Test failure if begin x2 before end."""
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

        self.assertContains(response, "Event indentation error", status_code=400)

    def test_failure_if_end_before_begin(self):
        """Test failure if end before begin."""
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
            b"DTSTART;TZID=Europe/London:20260325T200000\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(response, "No event to end", status_code=400)

    def test_failure_if_missing_summary(self):
        """Test failure if missing summary."""
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
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(
            response, "One or more events don't have a summary", status_code=400
        )

    def test_failure_if_missing_start(self):
        """Test failure if missing start."""
        self.client.login(username="testuser", password="password")

        importing_file_content = (
            b"BEGIN:VCALENDAR\n"
            b"VERSION:2.0\n"
            b"PRODID:TIMELY v1.0\n"
            b"CALSCALE:GREGORIAN\n"
            b"METHOD:PUBLISH\n"
            b"BEGIN:VEVENT\n"
            b"UID:e1\n"
            b"DTEND;TZID=Europe/London:20260325T210000\n"
            b"SUMMARY:Title Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})

        self.assertContains(
            response, "One or more events don't have a DTSTART", status_code=400
        )

    def test_failure_if_missing_end(self):
        """Test failure if missing end."""
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
            b"SUMMARY:Title Event 1\n"
            b"END:VEVENT\n"
            b"END:VCALENDAR\n"
        ).strip()

        importing_file = SimpleUploadedFile(
            name="importFile.txt",
            content=importing_file_content,
            content_type="text/plain",
        )

        response = self.client.post("/api/import/", {"file": importing_file})
        self.assertContains(
            response, "One or more events don't have a DTEND", status_code=400
        )
