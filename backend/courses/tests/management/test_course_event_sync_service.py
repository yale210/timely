import datetime
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Event, Preference
from courses.models import Course, CourseEnrollment, CourseEvent, Student, Teacher
from courses.services.event import CourseEventSyncService

User = get_user_model()


class CourseEventSyncServiceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.teacher_user = User.objects.create_user(
            username="teacher",
            password="password123",
            email="teacher@example.com",
        )
        cls.student_user = User.objects.create_user(
            username="student",
            password="password123",
            email="student@example.com",
        )
        cls.other_user = User.objects.create_user(
            username="other",
            password="password123",
            email="other@example.com",
        )

        cls.teacher = Teacher.objects.create(user=cls.teacher_user)
        cls.student = Student.objects.create(user=cls.student_user)
        cls.other_student = Student.objects.create(user=cls.other_user)

        Preference.objects.create(
            user=cls.student_user,
            day_start=datetime.time(7, 0),
            day_end=datetime.time(23, 0),
            timezone="Europe/London",
        )
        Preference.objects.create(
            user=cls.other_user,
            day_start=datetime.time(7, 0),
            day_end=datetime.time(23, 0),
            timezone="Europe/London",
        )

        cls.course = Course.objects.create(
            name="Python Basics",
            description="Intro course",
            lead=cls.teacher,
        )

        cls.course_event = CourseEvent.objects.create(
            course=cls.course,
            created_by=cls.teacher,
            title="Lesson 1",
            description="Intro lesson",
            location="Room 101",
            colour="#ff0000",
            start_time=timezone.now() + datetime.timedelta(days=2),
            end_time=timezone.now() + datetime.timedelta(days=2, hours=1),
        )

    def test_sync_course_event_to_core_creates_events_for_all_active_enrollments(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )
        CourseEnrollment.objects.create(
            course=self.course, student=self.other_student, active=True
        )

        stats = CourseEventSyncService.sync_course_event_to_core(self.course_event)

        self.assertEqual(stats["created"], 2)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])

        self.assertEqual(Event.objects.filter(user=self.student_user).count(), 1)
        self.assertEqual(Event.objects.filter(user=self.other_user).count(), 1)

        event = Event.objects.get(user=self.student_user)
        self.assertEqual(event.title, "Python Basics - Lesson 1")
        self.assertEqual(event.description, "Intro lesson")
        self.assertEqual(event.location, "Room 101")
        self.assertEqual(event.colour, "#ff0000")

    def test_sync_course_event_to_core_updates_existing_event(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        existing_event = Event.objects.create(
            user=self.student_user,
            title="Python Basics - Lesson 1",
            description="Old description",
            location="Old room",
            colour="#000000",
            start_time=self.course_event.start_time,
            end_time=self.course_event.end_time - datetime.timedelta(minutes=30),
        )

        stats = CourseEventSyncService.sync_course_event_to_core(self.course_event)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 1)
        self.assertEqual(stats["errors"], [])

        existing_event.refresh_from_db()
        self.assertEqual(existing_event.description, "Intro lesson")
        self.assertEqual(existing_event.location, "Room 101")
        self.assertEqual(existing_event.colour, "#ff0000")
        self.assertEqual(existing_event.end_time, self.course_event.end_time)

    def test_sync_course_event_to_core_returns_noop_when_no_enrollments(self):
        stats = CourseEventSyncService.sync_course_event_to_core(self.course_event)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(Event.objects.count(), 0)

    def test_sync_user_course_events_creates_events_for_enrolled_courses(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        stats = CourseEventSyncService.sync_user_course_events(self.student_user)

        self.assertEqual(stats["created"], 1)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(Event.objects.filter(user=self.student_user).count(), 1)

    def test_sync_user_course_events_updates_existing_event(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        existing_event = Event.objects.create(
            user=self.student_user,
            title="Python Basics - Lesson 1",
            description="Old description",
            location="Room 101",
            colour="#ff0000",
            start_time=self.course_event.start_time,
            end_time=self.course_event.end_time - datetime.timedelta(minutes=15),
        )

        stats = CourseEventSyncService.sync_user_course_events(self.student_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 1)
        self.assertEqual(stats["errors"], [])

        existing_event.refresh_from_db()
        self.assertEqual(
            existing_event.description,
            "Python Basics - Lesson 1'\nIntro lesson\nBy teacher",
        )
        self.assertEqual(existing_event.end_time, self.course_event.end_time)

    def test_sync_user_course_events_skips_users_without_enrollments(self):
        stats = CourseEventSyncService.sync_user_course_events(self.other_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(Event.objects.filter(user=self.other_user).count(), 0)

    @patch("courses.services.event.logger")
    def test_sync_course_event_to_core_collects_errors(self, mock_logger):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        with patch.object(Event.objects, "get", side_effect=Exception("boom")):
            stats = CourseEventSyncService.sync_course_event_to_core(self.course_event)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(len(stats["errors"]), 1)
        self.assertIn("boom", stats["errors"][0])
        mock_logger.error.assert_called()
