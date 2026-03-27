"""Tests for course CRUD views."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, CourseEnrollment, Student, Teacher
from courses.views import CourseViewSet


User = get_user_model()


class CourseViewTests(TestCase):
    """Test cases for the course CRUD view mixin."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()

        self.teacher_user = User.objects.create_user(
            username="course-teacher",
            password="password123",
            email="course-teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="course-student",
            password="password123",
            email="course-student@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.course = Course.objects.create(
            name="Algorithms",
            description="Learn algorithms.",
            lead=self.teacher,
        )
        CourseEnrollment.objects.create(
            course=self.course,
            student=self.student,
            active=True,
        )

    def test_list_returns_courses_for_enrolled_student(self):
        """Test list returns courses visible to the authenticated student."""
        view = CourseViewSet.as_view({"get": "list"})
        request = self.factory.get("/courses/")
        force_authenticate(request, user=self.student_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.course.id)

    def test_create_creates_course_for_teacher(self):
        """Test create saves a new course for the authenticated teacher."""
        view = CourseViewSet.as_view({"post": "create"})
        request = self.factory.post(
            "/courses/",
            {"name": "Operating Systems", "description": "Kernel basics."},
            format="json",
        )
        force_authenticate(request, user=self.teacher_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Course.objects.filter(
                name="Operating Systems",
                description="Kernel basics.",
                lead=self.teacher,
            ).exists()
        )

    def test_retrieve_includes_students_and_cohort(self):
        """Test retrieve includes student and cohort detail payloads."""
        view = CourseViewSet.as_view({"get": "retrieve"})
        request = self.factory.get(f"/courses/{self.course.pk}/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cohort"], 1)
        self.assertEqual(
            response.data["students"][0]["username"], self.student_user.username
        )

    def test_destroy_deactivates_course(self):
        """Test destroy soft-deletes the course by deactivating it."""
        view = CourseViewSet.as_view({"delete": "destroy"})
        request = self.factory.delete(f"/courses/{self.course.pk}/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.course.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.course.active)
