"""Tests for course event views."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from courses.models import Course, CourseEvent, Teacher
from courses.views import CourseViewSet


User = get_user_model()


class CourseEventsViewTests(TestCase):
    """Test cases for the course events view mixin."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.factory = APIRequestFactory()
        self.teacher_user = User.objects.create_user(
            username="events-teacher",
            password="password123",
            email="events-teacher@example.com",
        )
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.course = Course.objects.create(
            name="Discrete Mathematics",
            description="Sets and proofs.",
            lead=self.teacher,
        )
        self.event = CourseEvent.objects.create(
            title="Week 1 Lecture",
            course=self.course,
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_events_get_returns_course_events(self):
        """Test events GET returns the course event list."""
        view = CourseViewSet.as_view({"get": "events"})
        request = self.factory.get(f"/courses/{self.course.pk}/events/")
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.event.id)

    def test_events_post_creates_course_event(self):
        """Test events POST creates a course event."""
        view = CourseViewSet.as_view({"post": "events"})
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)
        request = self.factory.post(
            f"/courses/{self.course.pk}/events/",
            {
                "title": "Workshop",
                "description": "Problem session.",
                "location": "Lab 2",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
            },
            format="json",
        )
        force_authenticate(request, user=self.teacher_user)

        response = view(request, pk=self.course.pk)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CourseEvent.objects.filter(course=self.course, title="Workshop").exists()
        )
