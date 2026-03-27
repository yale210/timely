"""Tests for course permissions."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from courses.models import Teacher
from courses.permissions.teacher_permission import IsTeacher


User = get_user_model()


class IsTeacherPermissionTests(TestCase):
    """Test cases for is teacher permission."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.permission = IsTeacher()

        self.teacher_user = User.objects.create_user(
            username="teacher_user",
            password="password123",
            email="teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="student_user",
            password="password123",
            email="student@example.com",
        )
        self.superuser = User.objects.create_superuser(
            username="admin",
            password="password123",
            email="admin@example.com",
        )

    def test_has_permission_allows_active_teacher(self):
        """Test has permission allows active teacher."""
        Teacher.objects.create(user=self.teacher_user, active=True)
        request = self.factory.get("/fake-url/")
        request.user = self.teacher_user

        self.assertTrue(self.permission.has_permission(request, view=None))

    def test_has_permission_denies_non_teacher(self):
        """Test has permission denies non teacher."""
        request = self.factory.get("/fake-url/")
        request.user = self.student_user

        self.assertFalse(self.permission.has_permission(request, view=None))

    def test_has_permission_allows_superuser(self):
        """Test has permission allows superuser."""
        request = self.factory.get("/fake-url/")
        request.user = self.superuser

        self.assertTrue(self.permission.has_permission(request, view=None))

    def test_has_permission_denies_unauthenticated_user(self):
        """Test has permission denies unauthenticated user."""
        request = self.factory.get("/fake-url/")
        request.user = type("AnonymousUser", (), {"is_authenticated": False})()

        self.assertFalse(self.permission.has_permission(request, view=None))

    def test_has_permission_denies_inactive_teacher(self):
        """Test has permission denies inactive teacher."""
        Teacher.objects.create(user=self.teacher_user, active=False)
        request = self.factory.get("/fake-url/")
        request.user = self.teacher_user

        self.assertFalse(self.permission.has_permission(request, view=None))
