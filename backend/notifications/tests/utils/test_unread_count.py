"""Tests for unread notification count utilities."""

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase

from notifications.models import Notification
from notifications.utils.unread_count import (
    _unread_count_cache_key,
    increment_unread_count,
    refresh_unread_count,
    set_unread_count,
)

User = get_user_model()


class UnreadCountUtilsTests(TestCase):
    """Test cases for unread count utility helpers."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com"
        )
        cache.clear()

    def test_refresh_unread_count(self):
        """Test refresh_unread_count recalculates and caches the unread total."""
        Notification.objects.create(
            recipient=self.user, title="T1", message="M1", is_read=False
        )
        count = refresh_unread_count(self.user.id)
        self.assertEqual(count, 1)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 1)

    def test_increment_unread_count_none_cached(self):
        """Test increment_unread_count refreshes from storage when cache is empty."""
        Notification.objects.create(
            recipient=self.user, title="T1", message="M1", is_read=False
        )
        cache.clear()
        count = increment_unread_count(self.user.id, 1)
        self.assertEqual(count, 1)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 1)

    def test_increment_unread_count_with_cached(self):
        """Test increment_unread_count updates an existing cached value."""
        cache.set(_unread_count_cache_key(self.user.id), 5)
        count = increment_unread_count(self.user.id, 2)
        self.assertEqual(count, 7)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 7)

    def test_set_unread_count(self):
        """Test set_unread_count stores the supplied unread total."""
        set_unread_count(self.user.id, 10)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 10)

    def test_set_unread_count_negative(self):
        """Test set_unread_count clamps negative values to zero."""
        set_unread_count(self.user.id, -5)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 0)
