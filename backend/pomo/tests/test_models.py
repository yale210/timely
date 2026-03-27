"""Tests for pomo models."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from pomo.models import PomoSession


User = get_user_model()


class PomoSessionModelTests(TestCase):
    """Test cases for the PomoSession model."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="pomo-model-user",
            email="pomo-model@example.com",
            password="password123",
        )

    def test_str_returns_user_duration_and_completion_time(self):
        """Test the model string includes user, duration, and completion time."""
        completed_at = timezone.now()
        session = PomoSession.objects.create(
            user=self.user,
            duration_minutes=25,
            completed_at=completed_at,
        )

        self.assertEqual(
            str(session),
            f"{self.user.username} - 25 mins at {completed_at}",
        )

    def test_default_ordering_is_newest_completed_session_first(self):
        """Test sessions are ordered by completed_at descending."""
        older = PomoSession.objects.create(
            user=self.user,
            duration_minutes=15,
            completed_at=timezone.now() - timedelta(hours=1),
        )
        newer = PomoSession.objects.create(
            user=self.user,
            duration_minutes=30,
            completed_at=timezone.now(),
        )

        self.assertEqual(list(PomoSession.objects.all()), [newer, older])

    def test_created_at_is_set_automatically(self):
        """Test created_at is populated automatically on creation."""
        session = PomoSession.objects.create(
            user=self.user,
            duration_minutes=20,
            completed_at=timezone.now(),
        )

        self.assertIsNotNone(session.created_at)
