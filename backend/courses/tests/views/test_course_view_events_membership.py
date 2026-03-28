"""Tests for course view behaviour."""

import datetime

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from courses.models import (
    CourseEnrollment,
    CourseEvent,
    CourseJoinCode,
    Student,
)

from .course_view_test_support import CourseViewTestSupport, User


class CourseViewEventsMembershipTests(CourseViewTestSupport):
    def test_get_events_orders_by_start_time(self):
        later = timezone.now() + datetime.timedelta(days=1)
        earlier = timezone.now()

        CourseEvent.objects.create(
            title="Later",
            course=self.course,
            created_by=self.teacher,
            start_time=later,
            end_time=later + datetime.timedelta(hours=1),
        )
        CourseEvent.objects.create(
            title="Earlier",
            course=self.course,
            created_by=self.teacher,
            start_time=earlier,
            end_time=earlier + datetime.timedelta(hours=1),
        )
        CourseEnrollment.objects.get_or_create(
            course=self.course, student=self.student, active=True
        )
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.events_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["title"], "Earlier")
        self.assertEqual(response.data[1]["title"], "Later")

    def test_create_event_requires_authentication(self):
        response = self.client.post(
            self.events_url,
            {
                "title": "New Event",
                "start_time": timezone.now().isoformat(),
                "end_time": (timezone.now() + datetime.timedelta(hours=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_event_success(self):
        self.client.force_authenticate(user=self.teacher_user)
        start = timezone.now()
        end = start + datetime.timedelta(hours=1)

        response = self.client.post(
            self.events_url,
            {
                "title": "Lecture 1",
                "description": "Intro",
                "location": "Room 101",
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CourseEvent.objects.filter(course=self.course).count(), 1)

        event = CourseEvent.objects.first()
        self.assertEqual(event.title, "Lecture 1")
        self.assertEqual(event.created_by, self.teacher)

    def test_create_event_invalid_range_returns_400(self):
        self.client.force_authenticate(user=self.teacher_user)
        now = timezone.now()

        response = self.client.post(
            self.events_url,
            {
                "title": "Bad Event",
                "start_time": now.isoformat(),
                "end_time": (now - datetime.timedelta(hours=1)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # join / leave
    # -------------------------

    def test_join_requires_authentication(self):
        response = self.client.post(self.join_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_creates_enrollment(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            CourseEnrollment.objects.filter(
                course=self.course, student=self.student
            ).count(),
            1,
        )

    def test_join_reactivates_inactive_enrollment(self):
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=False
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment.refresh_from_db()
        self.assertTrue(enrollment.active)

    def test_join_creates_student_profile_if_missing(self):
        new_user = User.objects.create_user(
            username="newstudent",
            password="password123",
            email="newstudent@example.com",
        )
        self.assertFalse(Student.objects.filter(user=new_user).exists())

        self.client.force_authenticate(user=new_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Student.objects.filter(user=new_user).exists())

    def test_join_rejects_inactive_course(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.inactive_detail_url.replace("detail", "join"))
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_join_by_code_success(self):
        join_code = CourseJoinCode.objects.create(
            course=self.course,
            code="ABC123",
            active=True,
            expires_at=timezone.now() + datetime.timedelta(days=1),
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": join_code.code}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["course_id"], self.course.id)
        self.assertTrue(
            CourseEnrollment.objects.filter(
                course=self.course, student=self.student
            ).exists()
        )

    def test_join_by_code_creates_student_profile_if_missing(self):
        new_user = User.objects.create_user(
            username="codejoiner",
            password="password123",
            email="codejoiner@example.com",
        )
        self.assertFalse(Student.objects.filter(user=new_user).exists())

        CourseJoinCode.objects.create(
            course=self.course,
            code="CODEJOIN",
            active=True,
            expires_at=timezone.now() + datetime.timedelta(days=1),
        )

        self.client.force_authenticate(user=new_user)
        response = self.client.post(
            self.join_by_code_url, {"code": "CODEJOIN"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Student.objects.filter(user=new_user).exists())
        self.assertTrue(
            CourseEnrollment.objects.filter(
                course=self.course, student__user=new_user, active=True
            ).exists()
        )

    def test_join_by_code_reactivates_inactive_enrollment(self):
        CourseJoinCode.objects.create(
            course=self.course,
            code="REJOIN",
            active=True,
            expires_at=timezone.now() + datetime.timedelta(days=1),
        )
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=False
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": "REJOIN"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment.refresh_from_db()
        self.assertTrue(enrollment.active)

    def test_join_by_code_invalid_code_returns_400(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": "missing"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_join_by_code_expired_returns_400(self):
        CourseJoinCode.objects.create(
            course=self.course,
            code="EXPIRED",
            active=True,
            expires_at=timezone.now() - datetime.timedelta(minutes=1),
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": "EXPIRED"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", response.data["detail"])

    def test_leave_success(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment = CourseEnrollment.objects.get(
            course=self.course, student=self.student
        )
        self.assertFalse(enrollment.active)

    def test_leave_returns_404_when_no_student_profile(self):
        new_user = User.objects.create_user(
            username="nostudent",
            password="password123",
            email="nostudent@example.com",
        )

        self.client.force_authenticate(user=new_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_leave_returns_404_when_not_enrolled(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_code_requires_permission(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            reverse("course-join-code", args=[self.course.id]),
            {"expires_at": (timezone.now() + datetime.timedelta(days=1)).isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
