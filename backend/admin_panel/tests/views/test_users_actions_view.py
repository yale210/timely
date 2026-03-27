"""Tests for admin user action endpoints."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AdminUsersActionTests(APITestCase):
    """Test admin user list and filter actions."""
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username="admin",
            password="password",
            email="admin@example.com",
        )
        cls.regular_user = User.objects.create_user(
            username="regular",
            password="password",
            email="regular@example.com",
        )

    def setUp(self):
        """Create base users for admin user action tests."""
        self.url = reverse("admin-users")

    def test_admin_can_list_users(self):
        """Verify admins can retrieve the paginated user list."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)

    def test_admin_user_list_pagination(self):
        """Verify user list pagination can be customized with page size."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?page_size=1")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNotNone(response.data["next"])

    def test_regular_user_is_forbidden(self):
        """Verify non-admin users cannot access the user list action."""
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_filter_users_by_search_term(self):
        """Verify username search filters the admin user list."""
        User.objects.create_user(
            username="searchtarget",
            password="password",
            email="searchtarget@example.com",
        )
        User.objects.create_user(
            username="someoneelse",
            password="password",
            email="someoneelse@example.com",
        )
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?search=target")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["username"], "searchtarget")

    def test_admin_can_filter_users_by_email_search_term(self):
        """Verify email search filters the admin user list."""
        User.objects.create_user(
            username="emailmatch",
            password="password",
            email="emailmatch@example.com",
        )
        User.objects.create_user(
            username="differentuser",
            password="password",
            email="different@example.com",
        )
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?search=emailmatch@example.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["username"], "emailmatch")

    def test_admin_can_filter_users_by_staff_role(self):
        """Verify the staff role filter returns only staff users."""
        staff_user = User.objects.create_user(
            username="staffmember",
            password="password",
            email="staffmember@example.com",
        )
        staff_user.is_staff = True
        staff_user.save(update_fields=["is_staff"])
        User.objects.create_user(
            username="plainuser",
            password="password",
            email="plainuser@example.com",
        )
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?role=staff")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            {user["username"] for user in response.data["results"]},
            {"admin", "staffmember"},
        )

    def test_admin_can_filter_users_by_admin_role(self):
        """Verify the admin role filter returns only superusers."""
        staff_user = User.objects.create_user(
            username="staffmember",
            password="password",
            email="staffmember@example.com",
        )
        staff_user.is_staff = True
        staff_user.save(update_fields=["is_staff"])
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?role=admin")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["username"], "admin")

    def test_admin_can_filter_users_by_regular_user_role(self):
        """Verify the regular-user filter excludes staff and admins."""
        staff_user = User.objects.create_user(
            username="staffmember",
            password="password",
            email="staffmember@example.com",
        )
        staff_user.is_staff = True
        staff_user.save(update_fields=["is_staff"])
        extra_user = User.objects.create_user(
            username="anotherregular",
            password="password",
            email="anotherregular@example.com",
        )
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?role=users")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            {user["username"] for user in response.data["results"]},
            {self.regular_user.username, extra_user.username},
        )

    def test_admin_can_combine_search_and_role_filters(self):
        """Verify search and role filters can be applied together."""
        staff_user = User.objects.create_user(
            username="searchstaff",
            password="password",
            email="searchstaff@example.com",
        )
        staff_user.is_staff = True
        staff_user.save(update_fields=["is_staff"])
        User.objects.create_user(
            username="searchregular",
            password="password",
            email="searchregular@example.com",
        )
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(f"{self.url}?search=search&role=staff")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["username"], "searchstaff")
