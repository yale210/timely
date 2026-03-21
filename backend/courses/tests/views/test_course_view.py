import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone

from courses.models import Course, CourseEnrollment, CourseEvent, Student, Teacher

User = get_user_model()


class CourseViewSetListTests(APITestCase):
    """Tests for the CourseViewSet list action."""

    def setUp(self):
        self.student_user = User.objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)

        self.course1 = Course.objects.create(
            name="Python Basics",
            description="Learn Python",
            lead=self.teacher
        )
        self.course2 = Course.objects.create(
            name="Advanced Python",
            description="Advanced Python",
            lead=self.teacher
        )

        self.url = reverse("course-list")

    def test_list_unauthenticated(self):
        """Test that unauthenticated users cannot list courses."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated_user_without_courses(self):
        """Test listing courses for authenticated user not enrolled in any."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        # Should return 404 because student has no courses
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_teacher_sees_own_courses(self):
        """Test that teacher can see their own courses."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertIn("teacher", response.data)
        self.assertEqual(len(response.data["teacher"]), 2)

    def test_list_student_sees_enrolled_courses(self):
        """Test that student sees only enrolled courses."""
        CourseEnrollment.objects.create(course=self.course1, student=self.student)

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("student", response.data)
        self.assertEqual(len(response.data["student"]), 1)
        self.assertEqual(response.data["student"][0]["name"], "Python Basics")

    def test_list_student_with_multiple_enrollments(self):
        """Test student with multiple course enrollments."""
        CourseEnrollment.objects.create(course=self.course1, student=self.student)
        CourseEnrollment.objects.create(course=self.course2, student=self.student)

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["student"]), 2)
        self.assertEqual(response.data["count"], 2)

    def test_list_excludes_inactive_enrollments(self):
        """Test that inactive enrollments are not included."""
        enrollment = CourseEnrollment.objects.create(course=self.course1, student=self.student)
        enrollment.active = False
        enrollment.save()

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_orders_by_enrolled_at(self):
        """Test that courses are ordered by enrolled_at descending."""
        enrollment1 = CourseEnrollment.objects.create(course=self.course1, student=self.student)
        enrollment2 = CourseEnrollment.objects.create(course=self.course2, student=self.student)

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)

        # The last enrolled should appear first
        self.assertEqual(response.data["student"][0]["id"], self.course2.id)
        self.assertEqual(response.data["student"][1]["id"], self.course1.id)


class CourseViewSetCreateTests(APITestCase):
    """Tests for the CourseViewSet create action."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = User.objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )

        self.url = reverse("course-list")

    def test_create_unauthenticated(self):
        """Test that unauthenticated users cannot create courses."""
        data = {
            "name": "New Course",
            "description": "A new course"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_non_teacher(self):
        """Test that non-teachers cannot create courses."""
        self.client.force_authenticate(user=self.student_user)
        data = {
            "name": "New Course",
            "description": "A new course"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_teacher_success(self):
        """Test that teacher can create a course."""
        self.client.force_authenticate(user=self.teacher_user)
        data = {
            "name": "New Python Course",
            "description": "Learn Python from scratch"
        }
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.count(), 1)

        course = Course.objects.first()
        self.assertEqual(course.name, "New Python Course")
        self.assertEqual(course.description, "Learn Python from scratch")
        self.assertEqual(course.lead, self.teacher)

    def test_create_with_minimal_data(self):
        """Test creating a course with only required fields."""
        self.client.force_authenticate(user=self.teacher_user)
        data = {
            "name": "Minimal Course"
        }
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        course = Course.objects.first()
        self.assertEqual(course.name, "Minimal Course")
        self.assertEqual(course.description, "")

    def test_create_inactive_teacher(self):
        """Test that inactive teachers cannot create courses."""
        self.teacher.active = False
        self.teacher.save()

        self.client.force_authenticate(user=self.teacher_user)
        data = {
            "name": "New Course",
            "description": "A new course"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CourseViewSetRetrieveTests(APITestCase):
    """Tests for the CourseViewSet retrieve action."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = User.objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )
        self.student = Student.objects.create(user=self.student_user)

        self.course = Course.objects.create(
            name="Python Basics",
            description="Learn Python",
            lead=self.teacher
        )

    def test_retrieve_unauthenticated(self):
        """Test that unauthenticated users can retrieve a course."""
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_authenticated(self):
        """Test authenticated user can retrieve a course."""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Python Basics")
        self.assertEqual(response.data["description"], "Learn Python")

    def test_retrieve_nonexistent_course(self):
        """Test retrieving a non-existent course."""
        url = reverse("course-detail", args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_includes_cohort_info(self):
        """Test that retrieve includes cohort information."""
        CourseEnrollment.objects.create(course=self.course, student=self.student)

        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cohort"], 1)
        self.assertIn("students", response.data)

    def test_retrieve_includes_multiple_students(self):
        """Test cohort count with multiple students."""
        student_user2 = User.objects.create_user(
            username="student2", password="testpass123", email="student2@test.com"
        )
        student2 = Student.objects.create(user=student_user2)

        CourseEnrollment.objects.create(course=self.course, student=self.student)
        CourseEnrollment.objects.create(course=self.course, student=student2)

        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.data["cohort"], 2)
        self.assertEqual(len(response.data["students"]), 2)

    def test_retrieve_excludes_inactive_enrollments(self):
        """Test that inactive enrollments are not counted."""
        enrollment = CourseEnrollment.objects.create(course=self.course, student=self.student)
        enrollment.active = False
        enrollment.save()

        url = reverse("course-detail", args=[self.course.id])
        response = self.client.get(url)

        self.assertEqual(response.data["cohort"], 0)


class CourseViewSetUpdateTests(APITestCase):
    """Tests for the CourseViewSet update actions."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.other_teacher_user = User.objects.create_user(
            username="other_teacher", password="testpass123", email="other@test.com"
        )
        self.other_teacher = Teacher.objects.create(user=self.other_teacher_user)

        self.course = Course.objects.create(
            name="Python Basics",
            description="Learn Python",
            lead=self.teacher
        )

    def test_update_unauthenticated(self):
        """Test that unauthenticated users cannot update."""
        url = reverse("course-detail", args=[self.course.id])
        data = {"name": "Updated Name"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_non_lead_teacher(self):
        """Test that non-lead teachers cannot update the course."""
        self.client.force_authenticate(user=self.other_teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        data = {
            "name": "Updated Name",
            "description": "Updated Description"
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_lead_teacher_success(self):
        """Test that course lead can update the course."""
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        data = {
            "name": "Updated Python Course",
            "description": "Updated Description"
        }
        response = self.client.put(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Updated Python Course")
        self.assertEqual(self.course.description, "Updated Description")

    def test_partial_update_lead_teacher(self):
        """Test that course lead can partially update the course."""
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        data = {"name": "Partially Updated Name"}
        response = self.client.patch(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Partially Updated Name")
        self.assertEqual(self.course.description, "Learn Python")

    def test_update_invalid_data(self):
        """Test updating with invalid data."""
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        data = {"name": ""}  # Empty name
        response = self.client.put(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CourseViewSetDestroyTests(APITestCase):
    """Tests for the CourseViewSet destroy action."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.other_teacher_user = User.objects.create_user(
            username="other_teacher", password="testpass123", email="other@test.com"
        )
        self.other_teacher = Teacher.objects.create(user=self.other_teacher_user)

        self.course = Course.objects.create(
            name="Python Basics",
            lead=self.teacher
        )

    def test_destroy_unauthenticated(self):
        """Test that unauthenticated users cannot destroy."""
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_destroy_non_lead_teacher(self):
        """Test that non-lead teachers cannot destroy the course."""
        self.client.force_authenticate(user=self.other_teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_destroy_lead_teacher_soft_delete(self):
        """Test that destroying marks course as inactive (soft delete)."""
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.course.refresh_from_db()
        self.assertFalse(self.course.active)

    def test_destroy_does_not_hard_delete(self):
        """Test that destroy doesn't remove the course from database."""
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse("course-detail", args=[self.course.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Course.objects.filter(id=self.course.id).exists())


class CourseViewSetEventsTests(APITestCase):
    """Tests for the CourseViewSet events action."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = User.objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )
        self.student = Student.objects.create(user=self.student_user)

        self.course = Course.objects.create(
            name="Python Basics",
            lead=self.teacher
        )
        self.now = timezone.now()

        self.event_url = reverse("course-events", args=[self.course.id])

    def test_get_events_empty(self):
        """Test getting events when none exist."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.event_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_events_multiple(self):
        """Test getting multiple events."""

        CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1)
        )
        CourseEvent.objects.create(
            title="Lecture 2",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now + datetime.timedelta(days=1),
            end_time=self.now + datetime.timedelta(days=1, hours=1)
        )
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.event_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_events_ordered_by_start_time(self):
        """Test that events are ordered by start_time."""
        event1 = CourseEvent.objects.create(
            title="Lecture 1",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now + datetime.timedelta(days=1),
            end_time=self.now + datetime.timedelta(days=1, hours=1)
        )
        event2 = CourseEvent.objects.create(
            title="Lecture 2",
            course=self.course,
            created_by=self.teacher,
            start_time=self.now,
            end_time=self.now + datetime.timedelta(hours=1)
        )
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.event_url)
        self.assertEqual(response.data[0]["title"], "Lecture 2")
        self.assertEqual(response.data[1]["title"], "Lecture 1")

    def test_create_event_unauthenticated(self):
        """Test that unauthenticated users cannot create events."""
        data = {
            "title": "New Event",
            "start_time": self.now,
            "end_time": self.now + datetime.timedelta(hours=1)
        }
        response = self.client.post(self.event_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_event_non_teacher(self):
        """Test that non-teachers cannot create events."""
        self.client.force_authenticate(user=self.student_user)
        data = {
            "title": "New Event",
            "start_time": self.now,
            "end_time": self.now + datetime.timedelta(hours=1)
        }
        response = self.client.post(self.event_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_event_non_lead_teacher(self):
        """Test that non-lead teachers cannot create events."""
        other_teacher_user = User.objects.create_user(
            username="other_teacher", password="testpass123", email="other@test.com"
        )
        other_teacher = Teacher.objects.create(user=other_teacher_user)

        self.client.force_authenticate(user=other_teacher_user)
        data = {
            "title": "New Event",
            "start_time": self.now,
            "end_time": self.now + datetime.timedelta(hours=1)
        }
        response = self.client.post(self.event_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_event_lead_teacher_success(self):
        """Test that lead teacher can create events."""
        self.client.force_authenticate(user=self.teacher_user)
        data = {
            "title": "New Lecture",
            "description": "Introduction to functions",
            "location": "Room 101",
            "start_time": self.now,
            "end_time": self.now + datetime.timedelta(hours=1)
        }
        response = self.client.post(self.event_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CourseEvent.objects.count(), 1)

        event = CourseEvent.objects.first()
        self.assertEqual(event.title, "New Lecture")
        self.assertEqual(event.course, self.course)
        self.assertEqual(event.created_by, self.teacher)

    def test_create_event_invalid_times(self):
        """Test creating event with invalid time range."""
        self.client.force_authenticate(user=self.teacher_user)
        data = {
            "title": "Invalid Event",
            "start_time": self.now,
            "end_time": self.now - datetime.timedelta(hours=1)
        }
        response = self.client.post(self.event_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CourseViewSetJoinTests(APITestCase):
    """Tests for the CourseViewSet join action."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = User.objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )

        self.course = Course.objects.create(
            name="Python Basics",
            lead=self.teacher
        )
        self.join_url = reverse("course-join", args=[self.course.id])

    def test_join_unauthenticated(self):
        """Test that unauthenticated users cannot join."""
        response = self.client.post(self.join_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_inactive_course(self):
        """Test that students cannot join inactive courses."""
        self.course.active = False
        self.course.save()

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not active", response.data["detail"])

    def test_join_success(self):
        """Test successful course enrollment."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("successful", response.data["message"])
        self.assertEqual(CourseEnrollment.objects.count(), 1)

        enrollment = CourseEnrollment.objects.first()
        self.assertEqual(enrollment.course, self.course)
        self.assertEqual(enrollment.student.user, self.student_user)

    def test_join_creates_student_if_not_exists(self):
        """Test that joining creates a student profile if needed."""
        self.client.force_authenticate(user=self.student_user)
        self.assertEqual(Student.objects.filter(user=self.student_user).count(), 0)

        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Student.objects.filter(user=self.student_user).count(), 1)

    def test_join_already_enrolled(self):
        """Test joining a course already enrolled in."""
        student = Student.objects.create(user=self.student_user)
        CourseEnrollment.objects.create(course=self.course, student=student)

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)

        # Should still return success (get_or_create pattern)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(CourseEnrollment.objects.filter(course=self.course).count(), 1)

    def test_join_nonexistent_course(self):
        """Test joining a non-existent course."""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("course-join", args=[9999])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CourseViewSetLeaveTests(APITestCase):
    """Tests for the CourseViewSet leave action."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher", password="testpass123", email="teacher@test.com"
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student_user = User.objects.create_user(
            username="student", password="testpass123", email="student@test.com"
        )
        self.student = Student.objects.create(user=self.student_user)

        self.course = Course.objects.create(
            name="Python Basics",
            lead=self.teacher
        )
        self.enrollment = CourseEnrollment.objects.create(
            course=self.course,
            student=self.student
        )
        self.leave_url = reverse("course-leave", args=[self.course.id])

    def test_leave_unauthenticated(self):
        """Test that unauthenticated users cannot leave."""
        response = self.client.post(self.leave_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_leave_success(self):
        """Test successfully leaving a course."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("left the course", response.data["message"])

        self.enrollment.refresh_from_db()
        self.assertFalse(self.enrollment.active)

    def test_leave_not_enrolled(self):
        """Test leaving a course not enrolled in."""
        other_student_user = User.objects.create_user(
            username="other_student", password="testpass123", email="other@test.com"
        )

        self.client.force_authenticate(user=other_student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not enrolled", response.data["detail"])

    def test_leave_no_student_profile(self):
        """Test leaving when student profile doesn't exist."""
        new_user = User.objects.create_user(
            username="new_user", password="testpass123", email="new@test.com"
        )

        self.client.force_authenticate(user=new_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_leave_nonexistent_course(self):
        """Test leaving a non-existent course."""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("course-leave", args=[9999])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_leave_soft_delete(self):
        """Test that leaving doesn't hard delete the enrollment."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Enrollment still exists in DB but marked inactive
        self.assertTrue(
            CourseEnrollment.objects.filter(
                course=self.course,
                student=self.student
            ).exists()
        )