"""Tests for course staff views."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, CourseStaff, Teacher
from courses.views import CourseViewSet


User = get_user_model()


class CourseStaffViewTests(TestCase):
    """Test cases for the course staff view mixin."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.teacher_user = User.objects.create_user(
            username="staff-teacher",
            password="password123",
            email="staff-teacher@example.com",
        )
        self.staff_user = User.objects.create_user(
            username="staff-user",
            password="password123",
            email="staff-user@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.course = Course.objects.create(
            name="Compilers",
            description="Parsing and codegen.",
            lead=self.teacher,
        )

    def test_staff_get_returns_active_staff_members(self):
        """Test staff GET returns active course staff members."""
        staff_member = CourseStaff.objects.create(
            course=self.course,
            student=self.staff_user,
            active=True,
        )
        view = CourseViewSet.as_view({"get": "staff"})
        request = self.factory.get(f"/courses/{self.course.pk}/staff/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], staff_member.id)

    def test_staff_post_adds_staff_member(self):
        """Test staff POST adds a course staff member."""
        view = CourseViewSet.as_view({"post": "staff"})
        request = self.factory.post(
            f"/courses/{self.course.pk}/staff/",
            {"user_id": self.staff_user.id},
            format="json",
        )
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertIn(
            response.status_code, {status.HTTP_201_CREATED, status.HTTP_200_OK}
        )
        self.assertTrue(
            CourseStaff.objects.filter(
                course=self.course,
                student=self.staff_user,
                active=True,
            ).exists()
        )

    def test_staff_delete_removes_staff_member(self):
        """Test staff DELETE removes the requested staff member."""
        CourseStaff.objects.create(
            course=self.course,
            student=self.staff_user,
            active=True,
        )
        view = CourseViewSet.as_view({"delete": "staff"})
        request = self.factory.delete(
            f"/courses/{self.course.pk}/staff/",
            {"user_id": self.staff_user.id},
            format="json",
        )
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CourseStaff.objects.filter(
                course=self.course,
                student=self.staff_user,
            ).exists()
        )
