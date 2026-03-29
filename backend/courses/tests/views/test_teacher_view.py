"""Tests for teacher views."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, Teacher
from courses.views.teacher_view import TeacherView


User = get_user_model()


class TeacherViewTests(TestCase):
    """Test cases for the teacher management view set."""

    @classmethod
    def setUpTestData(cls):
        """Set up shared test fixtures."""
        cls.factory = APIRequestFactory()
        cls.admin_user = User.objects.create_superuser(
            username="teacher-view-admin",
            password="password123",
            email="teacher-view-admin@example.com",
        )
        cls.teacher_user = User.objects.create_user(
            username="teacher-view-user",
            password="password123",
            email="teacher-view@example.com",
        )
        cls.other_user = User.objects.create_user(
            username="teacher-view-other",
            password="password123",
            email="teacher-view-other@example.com",
        )
        cls.teacher = Teacher.objects.create(user=cls.teacher_user, active=True)
        cls.course = Course.objects.create(
            name="Security",
            description="Security principles.",
            lead=cls.teacher,
        )

    def test_list_returns_active_teachers(self):
        """Test list returns active teachers and the courses they lead."""
        view = TeacherView.as_view({"get": "list"})
        request = self.factory.get("/teachers/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], self.teacher_user.username)
        self.assertEqual(response.data[0]["courses"][0]["id"], self.course.id)

    def test_me_returns_current_teacher_profile(self):
        """Test me returns the authenticated teacher profile."""
        view = TeacherView.as_view({"get": "me"})
        request = self.factory.get("/teachers/me/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.teacher_user.username)
        self.assertEqual(response.data["user_id"], self.teacher_user.id)
        self.assertEqual(response.data["id"], self.teacher_user.id)
        self.assertTrue(response.data["active"])
        self.assertEqual(len(response.data["courses"]), 1)
        self.assertEqual(response.data["courses"][0]["id"], self.course.id)

    def test_me_returns_not_found_for_non_teacher(self):
        """Test me returns a not-found response for non-teachers."""
        view = TeacherView.as_view({"get": "me"})
        request = self.factory.get("/teachers/me/")
        force_authenticate(request, user=self.other_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["detail"], "You are not registered as a teacher."
        )

    def test_me_returns_not_found_for_inactive_teacher(self):
        """Test me returns a not-found response for inactive teachers."""
        self.teacher.active = False
        self.teacher.save(update_fields=["active"])

        view = TeacherView.as_view({"get": "me"})
        request = self.factory.get("/teachers/me/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["detail"], "You are not registered as a teacher."
        )

    def test_create_teacher_creates_teacher_for_authenticated_user(self):
        """Test create_teacher lets an admin register a teacher for a user."""
        view = TeacherView.as_view({"post": "create_teacher"})
        request = self.factory.post(
            "/teachers/",
            {"user_id": self.other_user.id},
            format="json",
        )
        force_authenticate(request, user=self.admin_user)

        response = view(request)

        self.assertIn(
            response.status_code, {status.HTTP_201_CREATED, status.HTTP_200_OK}
        )
        self.assertTrue(
            Teacher.objects.filter(user=self.other_user, active=True).exists()
        )

    def test_unregister_teacher_deactivates_teacher(self):
        """Test unregister_teacher deactivates the current teacher."""
        view = TeacherView.as_view({"post": "unregister_teacher"})
        request = self.factory.post("/teachers/unregister_teacher/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request)

        self.teacher.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.teacher.active)
