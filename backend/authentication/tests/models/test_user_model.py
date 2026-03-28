"""Tests for the custom user model."""

from django.test import TestCase

from ...models import User


class UserModelTest(TestCase):
    """Tests for the custom user model manager methods."""

    def test_create_user(self):
        """Verify that `create_user` creates a standard active user."""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password("password123"))

    def test_create_user_normalizes_username(self):
        """Verify that `create_user` trims and lowercases usernames before saving."""
        user = User.objects.create_user(
            username="  TestUser  ",
            email="test@example.com",
            password="password123",
        )

        self.assertEqual(user.username, "testuser")

    def test_create_superuser(self):
        """Verify that `create_superuser` creates an active admin user."""
        admin_user = User.objects.create_superuser(
            username="adminuser", email="admin@example.com", password="adminpassword"
        )
        self.assertEqual(admin_user.username, "adminuser")
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.check_password("adminpassword"))

    def test_create_superuser_normalizes_username(self):
        """Verify that `create_superuser` also trims and lowercases usernames."""
        admin_user = User.objects.create_superuser(
            username="  AdminUser  ",
            email="admin@example.com",
            password="adminpassword",
        )

        self.assertEqual(admin_user.username, "adminuser")

    def test_create_user_no_username(self):
        """Verify creating a user without a username raises a validation error."""
        with self.assertRaisesMessage(ValueError, "Users must have a username"):
            User.objects.create_user(username="", email="test@example.com")

    def test_create_user_with_none_username(self):
        """Verify creating a user with a null username raises a validation error."""
        with self.assertRaisesMessage(ValueError, "Users must have a username"):
            User.objects.create_user(username=None, email="test@example.com")

    def test_create_user_no_email(self):
        """Verify creating a user without an email raises a validation error."""
        with self.assertRaisesMessage(ValueError, "Users must have an email address"):
            User.objects.create_user(username="testuser", email="")
