"""Tests for base course views."""

from django.contrib.auth import get_user_model
from django.http import Http404
from django.test import TestCase

from courses.models import Course, Teacher
from courses.views.base_view import CourseViewSetBase


User = get_user_model()


class CourseViewSetBaseTests(TestCase):
    """Test cases for the course view-set base class."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.teacher_user = User.objects.create_user(
            username="base-teacher",
            password="password123",
            email="base-teacher@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.course = Course.objects.create(
            name="Base Course",
            description="Base view course.",
            lead=self.teacher,
        )
        self.view = CourseViewSetBase()

    def test_get_course_returns_matching_course(self):
        """Test get_course returns the matching course instance."""
        course = self.view.get_course(self.course.pk)

        self.assertEqual(course, self.course)

    def test_get_course_raises_404_for_missing_course(self):
        """Test get_course raises 404 for a missing course."""
        with self.assertRaises(Http404):
            self.view.get_course(999999)
