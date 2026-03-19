from django.test import TestCase
from django.contrib.auth import get_user_model
from authentication.authenticator import Authenticator

User = get_user_model()

class AuthenticatorTests(TestCase):
    def setUp(self):
        self.username = "testuser"
        self.password = "password123"
        self.user = User.objects.create_user(
            username=self.username, password=self.password, email="test@example.com"
        )
        self.backend = Authenticator()

    def test_authenticate_valid(self):
        user = self.backend.authenticate(None, username=self.username, password=self.password)
        self.assertEqual(user, self.user)

    def test_authenticate_invalid_username(self):
        user = self.backend.authenticate(None, username="wronguser", password=self.password)
        self.assertIsNone(user)

    def test_authenticate_invalid_password(self):
        user = self.backend.authenticate(None, username=self.username, password="wrongpassword")
        self.assertIsNone(user)
