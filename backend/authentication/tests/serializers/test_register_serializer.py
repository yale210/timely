from django.test import TestCase
from rest_framework.exceptions import ErrorDetail
from ...models import User
from ...serializers import RegisterSerializer


class RegisterSerializerTest(TestCase):
    """Tests for registration credential validation."""

    def test_valid_registration(self):
        """Verify account creation is valid."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertIsInstance(user, User)
        self.assertEqual(user.username, "newuser")
        self.assertEqual(user.email, "newuser@example.com")

    def test_registration_with_existing_username(self):
        """Verify registration using an existing username is invalid."""
        User.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="password123",
        )
        data = {
            "username": "existinguser",
            "email": "another@example.com",
            "password": "password123",
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(
            serializer.errors["username"][0],
            ErrorDetail("user with this username already exists.", code="unique"),
        )

    def test_registration_missing_fields(self):
        """Verify registration fails when fields are missing."""
        data = {
            "username": "incomplete"
            # Missing email and password
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertIn("password", serializer.errors)
