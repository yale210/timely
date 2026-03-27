"""Tests for course event sync services."""

import datetime
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Event, Preference
from courses.models import Course, CourseEnrollment, CourseEvent, Student, Teacher
from courses.services.core_event_sync import CourseEventSyncService

User = get_user_model()


class CourseEventSyncServiceTests(TestCase):
    """Test cases for course event sync service."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.teacher_user = User.objects.create_user(
            username="teacher",
            password="password123",
            email="teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="student",
            password="password123",
            email="student@example.com",
        )
        self.other_user = User.objects.create_user(
            username="other",
            password="password123",
            email="other@example.com",
        )

        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.other_student = Student.objects.create(user=self.other_user)

        Preference.objects.create(
            user=self.student_user,
            day_start=datetime.time(7, 0),
            day_end=datetime.time(23, 0),
            timezone="Europe/London",
        )
        Preference.objects.create(
            user=self.other_user,
            day_start=datetime.time(7, 0),
            day_end=datetime.time(23, 0),
            timezone="Europe/London",
        )

        self.course = Course.objects.create(
            name="Python Basics",
            description="Intro course",
            lead=self.teacher,
        )

        self.course_event = CourseEvent.objects.create(
            course=self.course,
            created_by=self.teacher,
            title="Lesson 1",
            description="Intro lesson",
            location="Room 101",
            colour="#ff0000",
            start_time=timezone.now() + datetime.timedelta(days=2),
            end_time=timezone.now() + datetime.timedelta(days=2, hours=1),
        )

    def test_sync_course_event_to_core_creates_events_for_all_active_enrollments(self):
        """Test sync course event to core creates events for all active enrollments."""
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
        """Test sync course event to core updates existing event."""
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
        """Test sync course event to core returns noop when no enrollments."""
        stats = CourseEventSyncService.sync_course_event_to_core(self.course_event)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(Event.objects.count(), 0)

    def test_sync_user_course_events_creates_events_for_enrolled_courses(self):
        """Test sync user course events creates events for enrolled courses."""
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        stats = CourseEventSyncService.sync_user_course_events(self.student_user)

        self.assertEqual(stats["created"], 1)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(Event.objects.filter(user=self.student_user).count(), 1)

    def test_sync_user_course_events_updates_existing_event(self):
        """Test sync user course events updates existing event."""
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
        """Test sync user course events skips users without enrollments."""
        stats = CourseEventSyncService.sync_user_course_events(self.other_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(Event.objects.filter(user=self.other_user).count(), 0)


