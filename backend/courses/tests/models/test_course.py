import datetime
from django.test import TestCase
from django.utils import timezone

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from courses.models import CourseEvent, Teacher, Course, Student, CourseEnrollment


class CourseModelTests(TestCase):
    """Tests for the Course model."""
    
    @classmethod
    def setUpTestData(cls):
        cls.teacher_user = get_user_model().objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        cls.teacher = Teacher.objects.create(user=cls.teacher_user)


    def test_course_creation(self):
        """Test basic course creation."""
        course = Course.objects.create(
            name="Python Basics",
            description="Learn Python fundamentals",
            lead=self.teacher,
        )
        self.assertEqual(course.name, "Python Basics")
        self.assertEqual(course.description, "Learn Python fundamentals")
        self.assertEqual(course.lead, self.teacher)

    def test_course_str(self):
        """Test course string representation."""
        course = Course.objects.create(name="Python Basics")
        self.assertEqual(str(course), "Python Basics")

    def test_course_active_default(self):
        """Test that course is active by default."""
        course = Course.objects.create(name="Python Basics")
        self.assertTrue(course.active)

    def test_course_can_be_deactivated(self):
        """Test that course can be deactivated."""
        course = Course.objects.create(name="Python Basics")
        course.active = False
        course.save()
        self.assertFalse(course.active)

    def test_course_created_at_auto_set(self):
        """Test that created_at is automatically set."""
        course = Course.objects.create(name="Python Basics")
        self.assertIsNotNone(course.created_at)
        self.assertIsInstance(course.created_at, datetime.datetime)

    def test_course_description_blank(self):
        """Test that course description can be blank."""
        course = Course.objects.create(name="Python Basics", description="")
        self.assertEqual(course.description, "")

    def test_course_lead_null(self):
        """Test that course lead can be null."""
        course = Course.objects.create(name="Python Basics", lead=None)
        self.assertIsNone(course.lead)

    def test_course_lead_cascade_set_null(self):
        """Test that deleting teacher sets course lead to null."""
        course = Course.objects.create(
            name="Python Basics",
            lead=self.teacher,
        )
        self.assertEqual(course.lead, self.teacher)
        self.teacher.delete()
        course.refresh_from_db()
        self.assertIsNone(course.lead)

    def test_multiple_courses(self):
        """Test creating multiple courses."""
        course1 = Course.objects.create(name="Python Basics")
        course2 = Course.objects.create(name="Advanced Python")
        self.assertEqual(Course.objects.count(), 2)
        self.assertIn(course1, Course.objects.all())
        self.assertIn(course2, Course.objects.all())


class CourseEnrollmentModelTests(TestCase):
    """Tests for the CourseEnrollment model."""

    def setUp(self):
        self.student_user = get_user_model().objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )
        self.student = Student.objects.create(user=self.student_user)
        self.course = Course.objects.create(name="Python Basics")

    def test_enrollment_creation(self):
        """Test basic enrollment creation."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        self.assertEqual(enrollment.course, self.course)
        self.assertEqual(enrollment.student, self.student)

    def test_enrollment_str(self):
        """Test enrollment string representation."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        expected = f"{self.student_user.username} enrolled in {self.course.name}"
        self.assertEqual(str(enrollment), expected)

    def test_enrollment_active_default(self):
        """Test that enrollment is active by default."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        self.assertTrue(enrollment.active)

    def test_enrollment_enrolled_at_auto_set(self):
        """Test that enrolled_at is automatically set."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        self.assertIsNotNone(enrollment.enrolled_at)
        self.assertIsInstance(enrollment.enrolled_at, datetime.datetime)

    def test_enrollment_unique_together(self):
        """Test that course-student combination is unique."""
        CourseEnrollment.objects.create(course=self.course, student=self.student)
        with self.assertRaises(Exception):
            CourseEnrollment.objects.create(course=self.course, student=self.student)

    def test_enrollment_cascade_delete_course(self):
        """Test that deleting course deletes enrollments."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        enrollment_id = enrollment.id
        self.course.delete()
        self.assertFalse(CourseEnrollment.objects.filter(id=enrollment_id).exists())

    def test_enrollment_cascade_delete_student(self):
        """Test that deleting student deletes enrollments."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        enrollment_id = enrollment.id
        self.student.delete()
        self.assertFalse(CourseEnrollment.objects.filter(id=enrollment_id).exists())

    def test_enrollment_related_name_course(self):
        """Test that enrollments are accessible from course."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        self.assertIn(enrollment, self.course.enrollments.all())

    def test_enrollment_related_name_student(self):
        """Test that courses are accessible from student."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        self.assertIn(enrollment, self.student.courses.all())

    def test_multiple_enrollments_same_course(self):
        """Test multiple students can enroll in same course."""
        student_user2 = get_user_model().objects.create_user(
            username="student2", password="testpass123", email="student2@test.com"
        )
        student2 = Student.objects.create(user=student_user2)

        enrollment1 = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        enrollment2 = CourseEnrollment.objects.create(
            course=self.course, student=student2
        )

        self.assertEqual(self.course.enrollments.count(), 2)
        self.assertIn(enrollment1, self.course.enrollments.all())
        self.assertIn(enrollment2, self.course.enrollments.all())

    def test_multiple_enrollments_same_student(self):
        """Test same student can enroll in multiple courses."""
        course2 = Course.objects.create(name="Advanced Python")

        enrollment1 = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        enrollment2 = CourseEnrollment.objects.create(
            course=course2, student=self.student
        )

        self.assertEqual(self.student.courses.count(), 2)
        self.assertIn(enrollment1, self.student.courses.all())
        self.assertIn(enrollment2, self.student.courses.all())

    def test_enrollment_can_be_deactivated(self):
        """Test that enrollment can be deactivated."""
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student
        )
        enrollment.active = False
        enrollment.save()
        self.assertFalse(enrollment.active)

    def test_enrollment_ordering(self):
        """Test that enrollments are ordered by enrolled_at descending."""
        CourseEnrollment.objects.create(course=self.course, student=self.student)

        # Create another student for a second enrollment
        student_user2 = get_user_model().objects.create_user(
            username="student2", password="testpass123", email="student2@test.com"
        )
        student2 = Student.objects.create(user=student_user2)
        CourseEnrollment.objects.create(course=self.course, student=student2)

        enrollments = list(CourseEnrollment.objects.all())
        self.assertEqual(enrollments[0].enrolled_at >= enrollments[1].enrolled_at, True)


class CourseEventModelTests(TestCase):
    """Tests for the CourseEvent model."""

    def setUp(self):
        self.teacher_user = get_user_model().objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.course = Course.objects.create(name="Python Basics", lead=self.teacher)
        self.now = timezone.now()

    def test_course_event_creation(self):
        """Test basic course event creation."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.title, "Lecture 1")
        self.assertEqual(event.course, self.course)
        self.assertEqual(event.created_by, self.teacher)

    def test_course_event_with_description(self):
        """Test course event with description."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            description="Introduction to Python",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.description, "Introduction to Python")

    def test_course_event_with_location(self):
        """Test course event with location."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            location="Room 101",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.location, "Room 101")

    def test_course_event_with_colour(self):
        """Test course event with colour."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            colour="#FF0000",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.colour, "#FF0000")

    def test_course_event_invalid_times(self):
        """Test that end time must be after start time."""
        event = CourseEvent(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now - datetime.timedelta(hours=1),
        )
        with self.assertRaises(ValidationError):
            event.full_clean()

    def test_course_event_equal_times(self):
        """Test that event can have equal start and end times."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now,
        )
        event.full_clean()
        self.assertEqual(event.start_time, event.end_time)

    def test_course_event_cascade_delete_course(self):
        """Test that deleting course deletes events."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        event_id = event.id
        self.course.delete()
        self.assertFalse(CourseEvent.objects.filter(id=event_id).exists())

    def test_course_event_created_by_set_null(self):
        """Test that deleting teacher sets created_by to null."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.created_by, self.teacher)
        self.teacher.delete()
        event.refresh_from_db()
        self.assertIsNone(event.created_by)

    def test_course_event_related_name(self):
        """Test that events are accessible from course."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertIn(event, self.course.events.all())

    def test_multiple_events_same_course(self):
        """Test multiple events can be created for same course."""
        event1 = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        event2 = CourseEvent.objects.create(
            title="Lecture 2",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now + datetime.timedelta(days=1),
            end_time=self.now + datetime.timedelta(days=1, hours=1),
        )
        self.assertEqual(self.course.events.count(), 2)
        self.assertIn(event1, self.course.events.all())
        self.assertIn(event2, self.course.events.all())

    def test_course_event_default_title(self):
        """Test that event has default title if not specified."""
        event = CourseEvent.objects.create(
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.title, "Untitled Event")

    def test_course_event_blank_fields(self):
        """Test that optional fields can be blank."""
        event = CourseEvent.objects.create(
            title="Lecture 1",
            description="",
            location="",
            colour="",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1),
        )
        self.assertEqual(event.description, "")
        self.assertEqual(event.location, "")
        self.assertEqual(event.colour, "")
