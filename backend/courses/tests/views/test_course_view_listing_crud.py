"""Tests for course view behaviour."""

from django.urls import reverse
from rest_framework import status

from courses.models import (
    Course,
    CourseEnrollment,
    CourseStaff,
)

from .course_view_test_support import CourseViewTestSupport


class CourseViewListingCrudTests(CourseViewTestSupport):
    """Test cases for course view listing crud."""
    def test_list_requires_authentication(self):
        """Test list requires authentication."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_student_courses(self):
        """Test list returns student courses."""
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Python Basics")

    def test_list_returns_teacher_courses(self):
        """Test list returns teacher courses."""
        second_course = Course.objects.create(
            name="Advanced Python",
            description="Advanced course",
            lead=self.teacher,
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.course.id, returned_ids)
        self.assertIn(second_course.id, returned_ids)

    def test_list_returns_all_courses_for_superuser(self):
        """Test list returns all courses for superuser."""
        Course.objects.create(
            name="Another Course",
            description="Another",
            lead=self.teacher,
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)

    # -------------------------
    # create
    # -------------------------

    def test_create_requires_authentication(self):
        """Test create requires authentication."""
        response = self.client.post(
            self.list_url, {"name": "New Course"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_teacher_permission(self):
        """Test create requires teacher permission."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.list_url,
            {"name": "New Course", "description": "Desc"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_course_success(self):
        """Test create course success."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            self.list_url,
            {"name": "New Course", "description": "A brand new course"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.filter(name="New Course").count(), 1)

        course = Course.objects.get(name="New Course")
        self.assertEqual(course.lead, self.teacher)
        self.assertEqual(course.description, "A brand new course")

    def test_create_course_with_minimal_payload(self):
        """Test create course with minimal payload."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(self.list_url, {"name": "Minimal"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        course = Course.objects.get(name="Minimal")
        self.assertEqual(course.description, "")

    # -------------------------
    # retrieve
    # -------------------------

    def test_retrieve_requires_authentication(self):
        """Test retrieve requires authentication."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_returns_course_data_with_cohort_and_students(self):
        """Test retrieve returns course data with cohort and students."""
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.course.name)
        self.assertEqual(response.data["cohort"], 1)

    def test_retrieve_excludes_inactive_enrollments_from_cohort(self):
        """Test retrieve excludes inactive enrollments from cohort."""
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=False
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cohort"], 0)

    def test_retrieve_nonexistent_course(self):
        """Test retrieve nonexistent course."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(reverse("course-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------
    # update / partial_update
    # -------------------------

    def test_update_requires_authentication(self):
        """Test update requires authentication."""
        response = self.client.put(
            self.detail_url,
            {"name": "Updated", "description": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_requires_permission(self):
        """Test update requires permission."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.put(
            self.detail_url,
            {"name": "Updated", "description": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_lead_can_change_name_and_description(self):
        """Test update lead can change name and description."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.put(
            self.detail_url,
            {"name": "Updated Name", "description": "Updated Description"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Updated Name")
        self.assertEqual(self.course.description, "Updated Description")

    def test_partial_update_lead_success(self):
        """Test partial update lead success."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.patch(
            self.detail_url,
            {"name": "Patched Name"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Patched Name")

    def test_partial_update_non_lead_cannot_change_name(self):
        """Test partial update non lead cannot change name."""
        CourseStaff.objects.create(
            course=self.course, student=self.other_user, active=True
        )

        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            self.detail_url,
            {"name": "Should Not Change", "description": "Patched Desc"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Python Basics")
        self.assertEqual(self.course.description, "Patched Desc")

    def test_update_invalid_data_returns_400(self):
        """Test update invalid data returns 400."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.put(self.detail_url, {"name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # destroy
    # -------------------------

    def test_destroy_requires_authentication(self):
        """Test destroy requires authentication."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_destroy_requires_lead_or_admin(self):
        """Test destroy requires lead or admin."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_destroy_soft_deletes_course(self):
        """Test destroy soft deletes course."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.course.refresh_from_db()
        self.assertFalse(self.course.active)

    def test_destroy_by_admin(self):
        """Test destroy by admin."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.course.refresh_from_db()
        self.assertFalse(self.course.active)
