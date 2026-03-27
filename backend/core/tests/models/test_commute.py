"""Tests for commute."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import Commute


class CommuteTests(TestCase):
    """Test cases for commute."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="testuser", password="password123", email="test@user.com"
        )

    def test_commute_can_be_created(self):
        """Test commute can be created."""
        commute = Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )

        self.assertEqual(commute.user, self.user)

    def test_commute_str(self):
        """Test commute str."""
        commute = Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )

        self.assertEqual(str(commute), "08:00:00 - 09:00:00")

    def test_user_can_have_multiple_commutes(self):
        """Test user can have multiple commutes."""
        Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )
        Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(18, 0),
            commute_end=datetime.time(19, 0),
        )

        self.assertEqual(self.user.commute.count(), 2)
