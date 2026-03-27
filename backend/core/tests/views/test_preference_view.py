"""Tests for preference view."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Preference
import datetime

User = get_user_model()


class PreferenceViewSetTests(APITestCase):
    """Test cases for preference view set."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="testuser", password="password", email="test@example.com"
        )
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse("preference-list")

    def test_create_preference_success(self):
        """Test create preference success."""
        data = {"day_start": "09:00:00", "day_end": "22:00:00"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Preference.objects.filter(user=self.user).exists())

    def test_create_preference_duplicate_fails(self):
        """Test create preference duplicate fails."""
        Preference.objects.create(
            user=self.user,
            day_start=datetime.time(8, 0),
            day_end=datetime.time(22, 0),
        )
        data = {"day_start": "09:00:00", "day_end": "22:00:00"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already has a set preference", str(response.data))

    def test_get_queryset_filters_by_user(self):
        """Test get queryset filters by user."""
        other_user = User.objects.create_user(
            username="other", password="password", email="other@example.com"
        )
        Preference.objects.create(
            user=other_user,
            day_start=datetime.time(8, 0),
            day_end=datetime.time(22, 0),
        )

        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 0)

        Preference.objects.create(
            user=self.user,
            day_start=datetime.time(8, 0),
            day_end=datetime.time(22, 0),
        )
        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 1)
