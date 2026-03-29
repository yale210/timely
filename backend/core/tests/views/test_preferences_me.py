"""Tests for preferences me."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class PreferenceMeTests(APITestCase):
    """Test cases for preference me."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="Secret123!",
        )

    def test_me_requires_auth(self):
        """Test me requires auth."""
        res = self.client.get("/api/preferences/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_get_creates_and_returns_pref(self):
        """Test me get creates and returns pref."""
        self.client.force_authenticate(user=self.user)

        res = self.client.get("/api/preferences/me/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.json()
        self.assertIn("id", data)
        self.assertIn("day_start", data)
        self.assertIn("day_end", data)
        self.assertIn("max_hours_study_per_day", data)
        self.assertIn("days_off", data)

    def test_me_patch_validation_max_hours(self):
        """Test me patch validation max hours."""
        self.client.force_authenticate(user=self.user)

        res = self.client.patch(
            "/api/preferences/me/",
            {"max_hours_study_per_day": 40},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("max_hours_study_per_day", res.json())

    def test_me_patch_validation_day_start_equals_day_end(self):
        """Test me patch validation day start equals day end."""
        self.client.force_authenticate(user=self.user)

        res = self.client.patch(
            "/api/preferences/me/",
            {"day_start": "08:00", "day_end": "08:00"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        body = res.json()

        # depends on how your ValidationError is mapped; could be day_end or non_field_errors
        self.assertTrue(
            "day_end" in body or "non_field_errors" in body,
            f"Expected day_end or non_field_errors, got {body}",
        )

    def test_me_patch_validation_day_start_after_day_end(self):
        """Test me patch validation day start after day end."""
        self.client.force_authenticate(user=self.user)

        res = self.client.patch(
            "/api/preferences/me/",
            {"day_start": "22:00", "day_end": "08:00"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("day_end", res.json())

    def test_me_patch_validation_day_schedule_rejects_reverse_window(self):
        """Test me patch validation day schedule rejects reverse window."""
        self.client.force_authenticate(user=self.user)

        res = self.client.patch(
            "/api/preferences/me/",
            {
                "day_schedule": [
                    {"day": 1, "start": "22:00", "end": "08:00"},
                    {"day": 2, "start": "08:00", "end": "22:00"},
                    {"day": 3, "start": "08:00", "end": "22:00"},
                    {"day": 4, "start": "08:00", "end": "22:00"},
                    {"day": 5, "start": "08:00", "end": "22:00"},
                    {"day": 6, "start": "08:00", "end": "22:00"},
                    {"day": 7, "start": "08:00", "end": "22:00"},
                ]
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("day_schedule", res.json())

    def test_me_patch_accepts_new_general_preferences(self):
        """Test me patch accepts new general preferences."""
        self.client.force_authenticate(user=self.user)

        res = self.client.patch(
            "/api/preferences/me/",
            {
                "default_landing_page": "calendar",
                "week_starts_on": "sunday",
                "time_format": "12h",
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["default_landing_page"], "calendar")
        self.assertEqual(body["week_starts_on"], "sunday")
        self.assertEqual(body["time_format"], "12h")
