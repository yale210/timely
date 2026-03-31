"""Shared support for course view tests."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from courses.models import Course, Student, Teacher

User = get_user_model()


class CourseViewTestSupport(APITestCase):
    """Shared fixtures for course view test cases."""

    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher",
            password="password123",
            email="teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="student",
            password="password123",
            email="student@example.com",
        )
        self.other_user = User.objects.create_user(
            username="other",
            password="password123",
            email="other@example.com",
        )
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password123",
            email="admin@example.com",
        )

        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.other_student = Student.objects.create(user=self.other_user)

        self.course = Course.objects.create(
            name="Python Basics",
            description="Intro course",
            lead=self.teacher,
        )
        self.inactive_course = Course.objects.create(
            name="Inactive Course",
            description="Inactive",
            lead=self.teacher,
            active=False,
        )

        self.list_url = reverse("course-list")
        self.detail_url = reverse("course-detail", args=[self.course.id])
        self.inactive_detail_url = reverse(
            "course-detail", args=[self.inactive_course.id]
        )
        self.events_url = reverse("course-events", args=[self.course.id])
        self.join_url = reverse("course-join", args=[self.course.id])
        self.leave_url = reverse("course-leave", args=[self.course.id])
        self.staff_url = reverse("course-staff", args=[self.course.id])
        self.students_url = reverse("course-students", args=[self.course.id])
        self.permissions_url = reverse("course-permissions", args=[self.course.id])
        self.join_by_code_url = reverse("course-join-by-code")
