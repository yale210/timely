import datetime
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from courses.models import Course, CourseEnrollment, CourseEvent, Student, Teacher
from courses.services.event import SyncCalendar

User = get_user_model()


class SyncCalendarTests(TestCase):
    def setUp(self):
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

        self.provider = Mock()
        self.sync_service = SyncCalendar(self.provider)

    def test_sync_user_calendar_creates_new_event(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )
        self.provider.get_events.return_value = []

        stats = self.sync_service.sync_user_calendar(self.student_user)

        self.assertEqual(stats["created"], 1)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["deleted"], 0)
        self.assertEqual(stats["errors"], [])

        self.provider.get_events.assert_called_once()
        self.provider.create_event.assert_called_once()
        called_user, called_data = self.provider.create_event.call_args.args
        self.assertEqual(called_user, self.student_user)
        self.assertEqual(called_data["title"], "Lesson 1")
        self.assertEqual(called_data["location"], "Room 101")

    def test_sync_user_calendar_updates_existing_event_when_changed(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.provider.get_events.return_value = [
            {
                "id": "external-1",
                "metadata": {"event_id": self.course_event.id},
                "title": "Wrong title",
                "start": "2000-01-01T00:00:00+00:00",
                "end": "2000-01-01T01:00:00+00:00",
                "description": "Old description",
            }
        ]
        self.provider.update_event.return_value = True

        stats = self.sync_service.sync_user_calendar(self.student_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 1)
        self.assertEqual(stats["deleted"], 0)
        self.assertEqual(stats["errors"], [])

        self.provider.update_event.assert_called_once()
        called_user, called_event_id, called_data = (
            self.provider.update_event.call_args.args
        )
        self.assertEqual(called_user, self.student_user)
        self.assertEqual(called_event_id, "external-1")
        self.assertEqual(called_data["title"], "Lesson 1")

    def test_sync_user_calendar_does_not_update_when_event_is_unchanged(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.provider.get_events.return_value = [
            {
                "id": "external-1",
                "metadata": {"event_id": self.course_event.id},
                "title": f"{self.course.name} - {self.course_event.title}",
                "start": self.course_event.start_time.isoformat(),
                "end": self.course_event.end_time.isoformat(),
                "description": self.course_event.description or "",
            }
        ]

        stats = self.sync_service.sync_user_calendar(self.student_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["deleted"], 0)
        self.assertEqual(stats["errors"], [])
        self.provider.update_event.assert_not_called()
        self.provider.create_event.assert_not_called()

    def test_sync_user_calendar_honors_date_filters(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        start_date = self.course_event.start_time + datetime.timedelta(days=1)
        end_date = self.course_event.end_time + datetime.timedelta(days=1)

        self.provider.get_events.return_value = []

        stats = self.sync_service.sync_user_calendar(
            self.student_user, start_date=start_date, end_date=end_date
        )

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["deleted"], 0)
        self.assertEqual(stats["errors"], [])
        self.provider.create_event.assert_not_called()

    def test_sync_user_calendar_returns_noop_when_user_has_no_enrollments(self):
        stats = self.sync_service.sync_user_calendar(self.other_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["deleted"], 0)
        self.assertEqual(stats["errors"], [])
        self.provider.get_events.assert_not_called()
        self.provider.create_event.assert_not_called()
        self.provider.update_event.assert_not_called()

    def test_sync_course_event_syncs_all_active_enrolled_users(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )
        CourseEnrollment.objects.create(
            course=self.course, student=self.other_student, active=True
        )

        stats = self.sync_service.sync_course_event(self.course_event)

        self.assertEqual(stats["synced_users"], 2)
        self.assertEqual(stats["errors"], [])
        self.assertEqual(self.provider.create_event.call_count, 2)

    def test_sync_course_event_only_syncs_specific_user_when_provided(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )
        CourseEnrollment.objects.create(
            course=self.course, student=self.other_student, active=True
        )

        stats = self.sync_service.sync_course_event(
            self.course_event, user=self.student_user
        )

        self.assertEqual(stats["synced_users"], 1)
        self.assertEqual(stats["errors"], [])
        self.provider.create_event.assert_called_once()

        called_user, called_data = self.provider.create_event.call_args.args
        self.assertEqual(called_user, self.student_user)
        self.assertEqual(called_data["title"], "Lesson 1")

    def test_remove_calendar_event_deletes_matching_event(self):
        self.provider.get_events.return_value = [
            {
                "id": "external-1",
                "metadata": {"event_id": self.course_event.id},
            }
        ]
        self.provider.delete_event.return_value = True

        result = self.sync_service.remove_calendar_event(
            self.student_user, self.course_event.id
        )

        self.assertTrue(result)
        self.provider.delete_event.assert_called_once_with(
            self.student_user, "external-1"
        )

    @patch("courses.services.event.logger")
    def test_remove_calendar_event_returns_false_when_not_found(self, mock_logger):
        self.provider.get_events.return_value = []

        result = self.sync_service.remove_calendar_event(
            self.student_user, self.course_event.id
        )

        self.assertFalse(result)
        self.provider.delete_event.assert_not_called()
        mock_logger.warning.assert_called_once_with(
            f"Calendar event for course_event_id {self.course_event.id} not found"
        )

    @patch("courses.services.event.logger")
    def test_sync_user_calendar_collects_provider_errors(self, mock_logger):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )
        self.provider.get_events.return_value = []
        self.provider.create_event.side_effect = Exception("boom")

        stats = self.sync_service.sync_user_calendar(self.student_user)

        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertEqual(stats["deleted"], 0)
        self.assertEqual(len(stats["errors"]), 1)
        self.assertIn("boom", stats["errors"][0])
        mock_logger.error.assert_called()
