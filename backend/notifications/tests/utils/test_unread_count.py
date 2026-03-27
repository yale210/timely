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
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com"
        )
        cache.clear()

    def test_refresh_unread_count(self):
        Notification.objects.create(
            recipient=self.user, title="T1", message="M1", is_read=False
        )
        count = refresh_unread_count(self.user.id)
        self.assertEqual(count, 1)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 1)

    def test_increment_unread_count_none_cached(self):
        Notification.objects.create(
            recipient=self.user, title="T1", message="M1", is_read=False
        )
        cache.clear()
        count = increment_unread_count(self.user.id, 1)
        self.assertEqual(count, 1)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 1)

    def test_increment_unread_count_with_cached(self):
        cache.set(_unread_count_cache_key(self.user.id), 5)
        count = increment_unread_count(self.user.id, 2)
        self.assertEqual(count, 7)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 7)

    def test_set_unread_count(self):
        set_unread_count(self.user.id, 10)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 10)

    def test_set_unread_count_negative(self):
        set_unread_count(self.user.id, -5)
        self.assertEqual(cache.get(_unread_count_cache_key(self.user.id)), 0)
