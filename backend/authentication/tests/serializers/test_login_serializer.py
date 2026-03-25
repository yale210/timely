from django.test import TestCase
from rest_framework.exceptions import ErrorDetail

from ...models import User
from ...serializers import LoginSerializer


class LoginSerializerTest(TestCase):
    """Tests for login credential validation."""

    def setUp(self):
        """Create a user for serializer authentication tests."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )

    def test_valid_login(self):
        """Verify that valid credentials return the authenticated user."""
        data = {"username": "testuser", "password": "password123"}
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["user"], self.user)

    def test_login_with_incorrect_password(self):
        """Verify that an incorrect password fails validation."""
        data = {"username": "testuser", "password": "wrongpassword"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("Invalid credentials.", serializer.errors["non_field_errors"])

    def test_login_with_non_existent_username(self):
        """Verify that an unknown username fails validation."""
        data = {"username": "nonexistentuser", "password": "password123"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("Invalid credentials.", serializer.errors["non_field_errors"])

    def test_login_missing_username(self):
        """Verify that the username field is required."""
        data = {"password": "password123"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(
            serializer.errors["username"][0],
            ErrorDetail("This field is required.", code="required"),
        )

    def test_login_missing_password(self):
        """Verify that the password field is required."""
        data = {"email": "test@example.com"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)
        self.assertEqual(
            serializer.errors["password"][0],
            ErrorDetail("This field is required.", code="required"),
        )

    def test_validate_method_directly(self):
        """Directly call validate to hit edge cases that DRF fields might catch earlier."""
        from rest_framework import serializers

        serializer = LoginSerializer()
        with self.assertRaisesMessage(
            serializers.ValidationError, "Username is required."
        ):
            serializer.validate({"username": "", "password": "password"})
        with self.assertRaisesMessage(
            serializers.ValidationError, "Password is required."
        ):
            serializer.validate({"username": "testuser", "password": ""})
