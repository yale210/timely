from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import (
    Teacher,
)

User = get_user_model()


class CourseViewTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password123",
            email="admin@example.com",
        )
        self.regular_user = User.objects.create_user(
            username="regular",
            password="password123",
            email="regular@example.com",
        )
        self.teacher_user = User.objects.create_user(
            username="teacher",
            password="password123",
            email="teacher@example.com",
        )
        self.inactive_teacher_user = User.objects.create_user(
            username="inactive_teacher",
            password="password123",
            email="inactive@example.com",
        )

        self.teacher = Teacher.objects.create(user=self.teacher_user, active=True)
        self.inactive_teacher = Teacher.objects.create(
            user=self.inactive_teacher_user,
            active=False,
        )

        self.url = reverse("teacher-list")
        self.create_url = reverse("teacher-create-teacher")

    # ... existing tests ...

    def test_create_teacher_success(self):
        new_user = User.objects.create_user(
            username="newteacher",
            password="password123",
            email="newteacher@example.com",
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            self.create_url,
            {"user_id": new_user.id},
            format="json",
        )

        self.assertIn(
            response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED)
        )
        self.assertTrue(Teacher.objects.filter(user=new_user, active=True).exists())
        self.assertEqual(response.data["user_id"], new_user.id)
        self.assertEqual(response.data["username"], new_user.username)
        self.assertTrue(response.data["active"])

    def test_create_teacher_reactivates_inactive_teacher(self):
        teacher = self.inactive_teacher
        teacher_user = self.inactive_teacher_user
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            self.create_url,
            {"user_id": teacher.user_id},
            format="json",
        )

        self.assertIn(
            response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED)
        )
        teacher.refresh_from_db()
        self.assertTrue(teacher.active)
        self.assertEqual(response.data["user_id"], teacher_user.id)
        self.assertTrue(response.data["active"])

    def test_create_teacher_invalid_user_id_returns_400(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            self.create_url,
            {"user_id": 999999},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_list_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_list_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_list_returns_active_teachers_for_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

        returned_user_ids = [item["user_id"] for item in response.data]
        self.assertIn(self.teacher_user.id, returned_user_ids)

    def test_teacher_list_is_active_teachers(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_user_ids = [item["user_id"] for item in response.data]
        self.assertNotIn(self.inactive_teacher_user.id, returned_user_ids)

    def test_teacher_list_response_shape(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

        item = response.data[0]
        self.assertIn("id", item)
        self.assertIn("user_id", item)
        self.assertIn("username", item)
        self.assertIn("active", item)
