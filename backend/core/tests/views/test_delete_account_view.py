"""Tests for delete account view."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from datetime import datetime
from django.utils import timezone
from core.models import Event
from core.models import Task


class DeleteAccountViewTests(TestCase):
    """Test cases for delete account view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password", email="test@user.com"
        )

    def test_fail_if_not_logged_in(self):
        """Test fail if not logged in."""
        response = self.client.get("/api/delete_account/")
        self.assertEqual(response.status_code, 401)

    def test_successful_delete(self):
        """Test successful delete."""
        self.client.login(username="testuser", password="password")

        self.assertEqual(get_user_model().objects.count(), 1)

        response = self.client.delete(
            "/api/delete_account/",
            {"password": "password"},
            format="json",
        )

        self.assertEqual(get_user_model().objects.count(), 0)

        self.assertEqual(response.data, {"message": "Account deleted successfully."})

    def test_events_cascade(self):
        """Test events cascade."""
        self.client.login(username="testuser", password="password")

        self.assertEqual(get_user_model().objects.count(), 1)

        Event.objects.create(
            user=self.user,
            title="Title Event 1",
            description="Description Event",
            location="Location Event",
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            end_time=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            last_edited=timezone.make_aware(datetime(2026, 2, 5, 12, 5, 48)),
        )

        self.assertTrue(Event.objects.filter(title="Title Event 1").exists())

        self.assertEqual(Event.objects.count(), 1)

        response = self.client.delete(
            "/api/delete_account/",
            {"password": "password"},
            format="json",
        )

        self.assertEqual(get_user_model().objects.count(), 0)

        # Events are deleted too
        self.assertEqual(Event.objects.count(), 0)

        self.assertEqual(response.data, {"message": "Account deleted successfully."})

    def test_tasks_cascade(self):
        """Test tasks cascade."""
        self.client.login(username="testuser", password="password")

        self.assertEqual(get_user_model().objects.count(), 1)

        self.assertEqual(Task.objects.count(), 0)

        Task.objects.create(
            user=self.user,
            title="Title Task 1",
            description="Description Task",
            estimated_minutes=5,
            start_time=timezone.make_aware(datetime(2026, 3, 25, 20, 0)),
            deadline=timezone.make_aware(datetime(2026, 3, 25, 21, 0)),
            importance=5,
            locked=False,
            allow_split=False,
        )

        self.assertTrue(Task.objects.filter(title="Title Task 1").exists())

        self.assertEqual(Task.objects.count(), 1)

        response = self.client.delete(
            "/api/delete_account/",
            {"password": "password"},
            format="json",
        )

        self.assertEqual(get_user_model().objects.count(), 0)

        # Tasks are deleted too
        self.assertEqual(Task.objects.count(), 0)

        self.assertEqual(response.data, {"message": "Account deleted successfully."})

    def test_rejects_incorrect_password(self):
        """Test delete account requires the current password."""
        self.client.login(username="testuser", password="password")

        response = self.client.delete(
            "/api/delete_account/",
            {"password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"password": ["Incorrect password."]})
        self.assertTrue(get_user_model().objects.filter(username="testuser").exists())
