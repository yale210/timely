from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.exceptions import ErrorDetail
from rest_framework.test import APITestCase

from .models import User
from .serializer import RegisterSerializer, LoginSerializer


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password("password123"))

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(
            username="adminuser", email="admin@example.com", password="adminpassword"
        )
        self.assertEqual(admin_user.username, "adminuser")
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.check_password("adminpassword"))


class RegisterSerializerTest(TestCase):
    def test_valid_registration(self):
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
        data = {
            "username": "incomplete"
            # Missing email and password
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertIn("password", serializer.errors)


class LoginSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )

    def test_valid_login(self):
        data = {"username": "testuser", "password": "password123"}
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["user"], self.user)

    def test_login_with_incorrect_password(self):
        data = {"username": "testuser", "password": "wrongpassword"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("Invalid credentials.", serializer.errors["non_field_errors"])

    def test_login_with_non_existent_username(self):
        data = {"username": "nonexistentuser", "password": "password123"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("Invalid credentials.", serializer.errors["non_field_errors"])

    def test_login_missing_username(self):
        data = {"password": "password123"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(
            serializer.errors["username"][0],
            ErrorDetail("This field is required.", code="required"),
        )

    def test_login_missing_password(self):
        data = {"email": "test@example.com"}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)
        self.assertEqual(
            serializer.errors["password"][0],
            ErrorDetail("This field is required.", code="required"),
        )


class RegisterViewTest(APITestCase):
    def test_successful_registration(self):
        url = reverse("register")
        data = {
            "username": "newapitestuser",
            "email": "newapitest@example.com",
            "password": "password123",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("username", response.data)
        self.assertIn("email", response.data)
        self.assertNotIn("password", response.data)  # Password should not be returned
        self.assertTrue(User.objects.filter(username="newapitestuser").exists())

    def test_registration_with_invalid_data(self):
        url = reverse("register")
        data = {
            "username": "invaliduser"
            # Missing email and password
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="invaliduser").exists())


class LoginAPIViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )
        self.login_url = reverse("login")

    def test_successful_login(self):
        data = {"username": "testuser", "password": "password123"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["id"], self.user.id)

    def test_login_with_invalid_credentials(self):
        data = {"username": "testuser", "password": "wrongpassword"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertIn("Invalid credentials.", response.data["non_field_errors"])

    def test_login_with_missing_fields(self):
        data = {"username": "testuser"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertEqual(
            response.data["password"][0],
            ErrorDetail("This field is required.", code="required"),
        )
