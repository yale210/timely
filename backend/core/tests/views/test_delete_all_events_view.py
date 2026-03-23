from datetime import datetime
from django.utils import timezone
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Event


class DeleteAllEventsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        response = self.client.get("/api/export/")
        self.assertEqual(response.status_code, 401)

    def test_success_if_logged_in(self):
        self.client.login(username="testuser", password="password")
        response = self.client.get("/api/export/")
        self.assertEqual(response.status_code, 200)

    