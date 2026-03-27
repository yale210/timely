"""Tests for the Profile model."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from profiles.models import Profile


User = get_user_model()


class ProfileModelTests(TestCase):
    """Test cases for profile model behavior."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="profile-model-user",
            email="profile-model@example.com",
            password="password123",
        )

    def test_profile_creation_sets_expected_defaults(self):
        """Test profile creation sets the expected default field values."""
        profile = Profile.objects.create(user=self.user, name="Profile Name")

        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.name, "Profile Name")
        self.assertIsNone(profile.date_of_birth)
        self.assertEqual(profile.slogan, "")
        self.assertEqual(profile.bio, "")
        self.assertFalse(profile.avatar)
        self.assertEqual(profile.xp, 0)
        self.assertEqual(profile.level, 1)
        self.assertIsNotNone(profile.creation_date)

    def test_user_profile_reverse_relation_returns_profile(self):
        """Test the user_profile reverse relation returns the linked profile."""
        profile = Profile.objects.create(user=self.user, name="Linked Profile")

        self.assertEqual(self.user.user_profile, profile)
