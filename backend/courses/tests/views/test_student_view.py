"""Tests for course student views."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, CourseEnrollment, Student, Teacher
from courses.views import CourseViewSet


User = get_user_model()


class CourseStudentViewTests(TestCase):
    """Test cases for the course student view mixin."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.admin_user = User.objects.create_superuser(
            username="students-admin",
            password="password123",
            email="students-admin@example.com",
        )
        self.teacher_user = User.objects.create_user(
            username="students-teacher",
            password="password123",
            email="students-teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="students-user",
            password="password123",
            email="students-user@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.course = Course.objects.create(
            name="Machine Learning",
            description="Models and training.",
            lead=self.teacher,
        )
        CourseEnrollment.objects.create(
            course=self.course,
            student=self.student,
            active=True,
        )

    def test_students_returns_active_students(self):
        """Test students returns active students for the course."""
        view = CourseViewSet.as_view({"get": "students"})
        request = self.factory.get(f"/courses/{self.course.pk}/students/")
        force_authenticate(request, user=self.admin_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], self.student_user.username)
