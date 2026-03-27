"""Tests for pomo views."""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from pomo.models import PomoSession

User = get_user_model()


class PomoSessionTests(APITestCase):
    """Test cases for pomo session API views."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/pomo/sessions/"

    def test_create_pomo_session(self):
        """Test creating a pomo session associates it with the current user."""
        data = {"duration_minutes": 25, "completed_at": timezone.now().isoformat()}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PomoSession.objects.count(), 1)
        self.assertEqual(PomoSession.objects.get().user, self.user)

    def test_get_pomo_sessions(self):
        """Test listing sessions returns the current user's session records."""
        PomoSession.objects.create(
            user=self.user, duration_minutes=25, completed_at=timezone.now()
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
