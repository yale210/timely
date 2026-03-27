"""Tests for preference."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import Preference
from core.serializers.preference_serializer import PreferenceSerializer

User = get_user_model()


class PreferenceSerializerTests(TestCase):
    """Test cases for preference serializer."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="testuser", password="password", email="test@example.com"
        )

    def test_validation_error_from_model(self):
        """Test validation error from model."""
        # Model has a clean() method that raises ValidationError if day_start == day_end
        data = {"day_start": "08:00:00", "day_end": "08:00:00"}
        serializer = PreferenceSerializer(
            data=data, context={"request": type("obj", (object,), {"user": self.user})}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("day_end", serializer.errors)

    def test_update_preference(self):
        """Test update preference."""
        pref = Preference.objects.create(
            user=self.user,
            day_start=datetime.time(8, 0),
            day_end=datetime.time(22, 0),
        )
        data = {"day_start": "09:00:00"}
        serializer = PreferenceSerializer(
            instance=pref,
            data=data,
            partial=True,
            context={"request": type("obj", (object,), {"user": self.user})},
        )
        self.assertTrue(serializer.is_valid())
        serializer.save()
        pref.refresh_from_db()
        self.assertEqual(pref.day_start, datetime.time(9, 0))
