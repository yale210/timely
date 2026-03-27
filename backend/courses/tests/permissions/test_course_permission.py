"""Tests for course permissions."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from courses.models import Course, CourseEnrollment, CourseStaff, Student, Teacher
from courses.permissions.course_permission import CoursePermission


User = get_user_model()

class CoursePermissionTests(TestCase):
    """Test cases for course permission."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.permission = CoursePermission()

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
        self.staff_user = User.objects.create_user(
            username="staff_user",
            password="password123",
            email="staff@example.com",
        )
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password123",
            email="admin@example.com",
        )

        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.staff_student = Student.objects.create(user=self.staff_user)

        self.course = Course.objects.create(
            name="Python Basics",
            description="Intro course",
            lead=self.teacher,
        )

    def _request(self, user):
        """Build a request object for permission tests."""
        request = self.factory.get("/fake-url/")
        request.user = user
        return request

    def _view(self, action):
        """Build a view stub for permission tests."""
        return type("View", (), {"action": action})()

    def test_has_permission_create_requires_teacher(self):
        """Test has permission create requires teacher."""
        request = self._request(self.student_user)
        view = self._view("create")

        self.assertFalse(self.permission.has_permission(request, view))

    def test_has_permission_create_allows_teacher(self):
        """Test has permission create allows teacher."""
        request = self._request(self.teacher_user)
        view = self._view("create")

        self.assertTrue(self.permission.has_permission(request, view))

    def test_has_object_permission_retrieve_allows_enrolled_student(self):
        """Test has object permission retrieve allows enrolled student."""
        CourseEnrollment.objects.create(
            course=self.course,
            student=self.student,
            active=True,
        )
        request = self._request(self.student_user)
        view = self._view("retrieve")

        self.assertTrue(
            self.permission.has_object_permission(request, view, self.course)
        )

    def test_has_object_permission_retrieve_denies_unrelated_student(self):
        """Test has object permission retrieve denies unrelated student."""
        request = self._request(self.staff_user)
        view = self._view("retrieve")

        self.assertFalse(
            self.permission.has_object_permission(request, view, self.course)
        )

    def test_has_object_permission_update_allows_lead(self):
        """Test has object permission update allows lead."""
        request = self._request(self.teacher_user)
        view = self._view("update")

        self.assertTrue(
            self.permission.has_object_permission(request, view, self.course)
        )

    def test_has_object_permission_update_allows_active_staff(self):
        """Test has object permission update allows active staff."""
        CourseStaff.objects.create(
            course=self.course,
            student=self.staff_user,
            active=True,
        )
        request = self._request(self.staff_user)
        view = self._view("partial_update")

        self.assertTrue(
            self.permission.has_object_permission(request, view, self.course)
        )

    def test_has_object_permission_destroy_denies_non_lead(self):
        """Test has object permission destroy denies non lead."""
        request = self._request(self.student_user)
        view = self._view("destroy")

        self.assertFalse(
            self.permission.has_object_permission(request, view, self.course)
        )

    def test_has_object_permission_destroy_allows_admin(self):
        """Test has object permission destroy allows admin."""
        request = self._request(self.admin_user)
        view = self._view("destroy")

        self.assertTrue(
            self.permission.has_object_permission(request, view, self.course)
        )

    def test_has_object_permission_join_allows_authenticated_user(self):
        """Test has object permission join allows authenticated user."""
        request = self._request(self.student_user)
        view = self._view("join")

        self.assertTrue(
            self.permission.has_object_permission(request, view, self.course)
        )
