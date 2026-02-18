from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AdminUserListViewTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@example.com",
        )
        self.regular_user = User.objects.create_user(
            username="regular",
            password="password",
            email="regular@example.com",
        )
        self.url = reverse("admin-users")

    def test_admin_can_list_users(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_regular_user_is_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
