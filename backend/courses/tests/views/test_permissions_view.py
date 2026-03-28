"""Tests for course permission views."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, Teacher
from courses.views import CourseViewSet


User = get_user_model()


class CoursePermissionsViewTests(TestCase):
    """Test cases for the course permissions view mixin."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.teacher_user = User.objects.create_user(
            username="permissions-teacher",
            password="password123",
            email="permissions-teacher@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.course = Course.objects.create(
            name="Networks",
            description="Protocols and routing.",
            lead=self.teacher,
        )

    def test_permissions_returns_permission_flags(self):
        """Test permissions returns course permission flags for the user."""
        view = CourseViewSet.as_view({"get": "permissions"})
        request = self.factory.get(f"/courses/{self.course.pk}/permissions/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["can_view_course_details"])
        self.assertTrue(response.data["can_create_join_code"])
        self.assertTrue(response.data["can_update_course"])
