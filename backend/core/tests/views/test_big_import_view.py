"""A single scenario test for the import view, simulating a realistic import file"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from core.models import Event

# This will aim to create a "realistic" file import with varying data and event types
# This file will also be larger than other tests
class RealisitcImportViewTests(TestCase):
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
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250915T090000\n"
            b"DTEND;TZID=Europe/London:20250915T110000\n"
            b"SUMMARY:Module 1 Lecture\n"
            b"DESCRIPTION:Module 1 Description\n"
            b"LOCATION:London University\n"
            b"RRULE:FREQ=WEEKLY;UNTIL=20260430T000000\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e2\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250916T090000\n"
            b"DTEND;TZID=Europe/London:20250916T110000\n"
            b"SUMMARY:Module 2 Lecture\n"
            b"DESCRIPTION:Module 2 Description\n"
            b"LOCATION:London University\n"
            b"RRULE:FREQ=WEEKLY;UNTIL=20260430T000000\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e3\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250917T140000\n"
            b"DTEND;TZID=Europe/London:20250917T160000\n"
            b"SUMMARY:Module 3 Lecture\n"
            b"DESCRIPTION:Module 3 Description\n"
            b"LOCATION:London University\n"
            b"RRULE:FREQ=WEEKLY;UNTIL=20260430T000000\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e4\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250918T140000\n"
            b"DTEND;TZID=Europe/London:20250918T160000\n"
            b"SUMMARY:Module 4 Lecture\n"
            b"DESCRIPTION:Module 4 Description\n"
            b"LOCATION:London University\n"
            b"RRULE:FREQ=WEEKLY;UNTIL=20260430T000000\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e5\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:2025018T140000\n"
            b"DTEND;TZID=Europe/London:20250918T150000\n"
            b"SUMMARY:Module 1 Lab\n"
            b"LOCATION:London University Building 2\n"
            b"RRULE:FREQ=WEEKLY;UNTIL=20260430T000000\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e6\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:2025019T100000\n"
            b"DTEND;TZID=Europe/London:20250919T200000\n"
            b"SUMMARY:Hackathon\n"
            b"LOCATION:In a different place\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e7\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250920T100000\n"
            b"DTEND;TZID=Europe/London:20250920T200000\n"
            b"SUMMARY:Overlapping time 1\n"
            b"LOCATION:overlap1\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e8\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250920T100000\n"
            b"DTEND;TZID=Europe/London:20250920T200000\n"
            b"SUMMARY:Overlapping time 2\n"
            b"LOCATION:overlap2\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e9\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250920T100000\n"
            b"DTEND;TZID=Europe/London:20250920T210000\n"
            b"SUMMARY:Same Name Diff Time\n"
            b"LOCATION:1\n"
            b"END:VEVENT\n"

            b"BEGIN:VEVENT\n"
            b"UID:e8\n"
            b"DTSTAMP:20250830T090000\n"
            b"DTSTART;TZID=Europe/London:20250920T100000\n"
            b"DTEND;TZID=Europe/London:20250920T200000\n"
            b"SUMMARY:Same Name Diff Time\n"
            b"LOCATION:1\n"
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
        self.assertTrue(Event.objects.filter(title="Module 1 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 2 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 3 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 4 Lecture").exists())
        self.assertTrue(Event.objects.filter(title="Module 1 Lab").exists())
        self.assertTrue(Event.objects.filter(title="Hackathon").exists())
        self.assertTrue(Event.objects.filter(title="Overlapping time 1").exists())
        self.assertTrue(Event.objects.filter(title="Overlapping time 2").exists())
        self.assertTrue(Event.objects.filter(title="Same Name Diff Time").exists())

        self.assertEqual(Event.objects.count(), 10)