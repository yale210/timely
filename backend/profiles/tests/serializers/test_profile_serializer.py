"""Tests for profile serializer behavior."""

import datetime

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import serializers
from rest_framework.test import APIRequestFactory

from profiles.models.profile import Profile
from profiles.serializers.profile_serializer import (
    ProfileSerializer,
    PublicProfileSerializer,
)

User = get_user_model()


class ProfileSerializerTests(TestCase):
    """Test validation for editable profile serializer fields."""

    def test_serializer_marks_xp_and_level_read_only(self):
        """Verify progression fields are not writable through the profile serializer."""
        serializer = ProfileSerializer()

        self.assertIn("xp", serializer.Meta.read_only_fields)
        self.assertIn("level", serializer.Meta.read_only_fields)

    def test_validate_date_of_birth_past(self):
        """Verify past dates of birth pass validation."""
        serializer = ProfileSerializer()
        past_date = timezone.now().date() - datetime.timedelta(days=1)
        self.assertEqual(serializer.validate_date_of_birth(past_date), past_date)

    def test_validate_date_of_birth_future(self):
        """Verify future dates of birth are rejected."""
        serializer = ProfileSerializer()
        future_date = timezone.now().date() + datetime.timedelta(days=1)
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_date_of_birth(future_date)
        self.assertEqual(
            cm.exception.detail[0], "Date of birth cannot be in the future."
        )

    def test_validate_date_of_birth_none(self):
        """Verify missing dates of birth remain allowed."""
        serializer = ProfileSerializer()
        self.assertIsNone(serializer.validate_date_of_birth(None))


class PublicProfileSerializerTests(TestCase):
    """Test serialization behavior for public profile responses."""

    def setUp(self):
        """Create a user/profile pair shared by public serializer tests."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com"
        )
        # Profile might be auto-created by signals
        self.profile, _ = Profile.objects.get_or_create(
            user=self.user, defaults={"name": "Test"}
        )

    def test_get_avatar_url_none(self):
        """Verify missing avatars serialize as ``None``."""
        serializer = PublicProfileSerializer(instance=self.profile)
        self.assertIsNone(serializer.get_avatar_url(self.profile))

    def test_get_avatar_url_with_request(self):
        """Verify avatar URLs become absolute when request context exists."""
        avatar = SimpleUploadedFile(
            "avatar.png", b"file_content", content_type="image/png"
        )
        self.profile.avatar = avatar
        self.profile.save()

        factory = APIRequestFactory()
        request = factory.get("/")

        serializer = PublicProfileSerializer(
            instance=self.profile, context={"request": request}
        )
        avatar_url = serializer.get_avatar_url(self.profile)
        self.assertIn("http://testserver", avatar_url)
        self.assertIn("/api/media/avatars/avatar", avatar_url)

    def test_get_avatar_url_without_request(self):
        """Verify avatar URLs stay relative without request context."""
        avatar = SimpleUploadedFile(
            "avatar2.png", b"file_content", content_type="image/png"
        )
        self.profile.avatar = avatar
        self.profile.save()

        serializer = PublicProfileSerializer(instance=self.profile)
        avatar_url = serializer.get_avatar_url(self.profile)
        self.assertTrue(avatar_url.startswith("/api/media/avatars/avatar2"))
