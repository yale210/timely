"""Tests for course view behaviour."""

import datetime

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from courses.models import (
    Course,
    CourseEnrollment,
    CourseEvent,
    CourseJoinCode,
    CourseStaff,
    Student,
)

from .course_view_test_support import CourseViewTestSupport, User


class CourseViewStaffPermissionsTests(CourseViewTestSupport):
    def test_staff_get_requires_lead_or_admin(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.staff_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_get_returns_active_staff(self):
        CourseStaff.objects.create(
            course=self.course, student=self.other_user, active=True
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.staff_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["user_id"], self.other_user.id)

    def test_staff_post_adds_member(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            self.staff_url, {"user_id": self.other_user.id}, format="json"
        )

        self.assertIn(
            response.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK)
        )
        self.assertTrue(
            CourseStaff.objects.filter(
                course=self.course, student=self.other_user, active=True
            ).exists()
        )

    def test_staff_post_validates_user_id(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(self.staff_url, {"user_id": 999999}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_delete_requires_user_id(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(self.staff_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("required", response.data["detail"])

    def test_staff_delete_removes_staff_member(self):
        CourseStaff.objects.create(
            course=self.course, student=self.other_user, active=True
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(
            self.staff_url, {"user_id": self.other_user.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CourseStaff.objects.filter(
                course=self.course, student=self.other_user
            ).exists()
        )

    def test_staff_delete_returns_404_when_missing(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(
            self.staff_url, {"user_id": self.other_user.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------
    # students / permissions
    # -------------------------

    def test_students_get_returns_only_active_enrollments(self):
        older = CourseEnrollment.objects.create(
            course=self.course,
            student=self.student,
            active=True,
        )
        older.enrolled_at = timezone.now() - datetime.timedelta(days=1)
        older.save(update_fields=["enrolled_at"])
        CourseEnrollment.objects.create(
            course=self.course,
            student=self.other_student,
            active=False,
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.students_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["user_id"], self.student_user.id)
        self.assertEqual(response.data[0]["username"], self.student_user.username)
        self.assertEqual(response.data[0]["email"], self.student_user.email)

    def test_permissions_get_returns_course_permission_flags(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.permissions_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["can_view_course_details"])
        self.assertTrue(response.data["can_view_events"])
        self.assertTrue(response.data["can_change_name"])
        self.assertTrue(response.data["can_change_description"])
        self.assertTrue(response.data["can_update_course"])
        self.assertTrue(response.data["can_destroy_course"])
        self.assertTrue(response.data["can_manage_staff"])
        self.assertTrue(response.data["can_join"])
        self.assertTrue(response.data["can_leave"])

    # -------------------------
    # join_code
    # -------------------------

