from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()

class PreferenceMeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="Secret123!",
        )

    def test_me_requires_auth(self):
        res = self.client.get("/api/preferences/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_get_creates_and_returns_pref(self):
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
        self.client.force_authenticate(user=self.user)

        res = self.client.patch(
            "/api/preferences/me/",
            {"max_hours_study_per_day": 40},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("max_hours_study_per_day", res.json())

    def test_me_patch_validation_day_start_equals_day_end(self):
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
