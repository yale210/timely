"""Tests for course membership views."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, CourseEnrollment, CourseJoinCode, Student, Teacher
from courses.views import CourseViewSet


User = get_user_model()


class CourseMembershipViewTests(TestCase):
    """Test cases for the course membership view mixin."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.teacher_user = User.objects.create_user(
            username="membership-teacher",
            password="password123",
            email="membership-teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="membership-student",
            password="password123",
            email="membership-student@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.course = Course.objects.create(
            name="Databases",
            description="Relational data.",
            lead=self.teacher,
        )

    def test_join_creates_enrollment_for_student(self):
        """Test join creates an active enrollment for the requester."""
        view = CourseViewSet.as_view({"post": "join"})
        request = self.factory.post(f"/courses/{self.course.pk}/join/")
        force_authenticate(request, user=self.student_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            CourseEnrollment.objects.filter(
                course=self.course,
                student=self.student,
                active=True,
            ).exists()
        )

    def test_leave_deactivates_existing_enrollment(self):
        """Test leave deactivates the existing enrollment."""
        CourseEnrollment.objects.create(
            course=self.course,
            student=self.student,
            active=True,
        )
        view = CourseViewSet.as_view({"post": "leave"})
        request = self.factory.post(f"/courses/{self.course.pk}/leave/")
        force_authenticate(request, user=self.student_user)

        response = view(request, pk=self.course.pk)

        enrollment = CourseEnrollment.objects.get(course=self.course, student=self.student)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(enrollment.active)

    def test_join_by_code_enrolls_student(self):
        """Test join_by_code enrolls a student when the code is valid."""
        join_code = CourseJoinCode.objects.create(
            course=self.course,
            code="JOINME123",
            active=True,
            expires_at=timezone.now() + timedelta(days=1),
        )
        view = CourseViewSet.as_view({"post": "join_by_code"})
        request = self.factory.post(
            "/courses/join-by-code/",
            {"code": join_code.code},
            format="json",
        )
        force_authenticate(request, user=self.student_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            CourseEnrollment.objects.filter(course=self.course, student=self.student).exists()
        )

    def test_join_code_creates_join_code_for_lead_teacher(self):
        """Test join_code creates a join code for the course."""
        view = CourseViewSet.as_view({"post": "join_code"})
        request = self.factory.post(
            f"/courses/{self.course.pk}/join-code/",
            {"expires_at": (timezone.now() + timedelta(days=2)).isoformat()},
            format="json",
        )
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CourseJoinCode.objects.filter(course=self.course).exists())
