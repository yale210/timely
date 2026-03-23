"""Utilities for managing user unread notification counts."""

from django.core.cache import cache

from notifications.models import Notification

# Cache duration for unread counts
UNREAD_COUNT_CACHE_TTL_SECONDS = 60 * 60


def _unread_count_cache_key(user_id):
    """Generate the cache key for a user's unread count.

    Args:
        user_id: ID of the user.

    Returns:
        A string cache key.
    """
    return f"notifications:unread_count:{user_id}"


def refresh_unread_count(user_id):
    """Recalculate and cache the unread notification count for a user.

    Args:
        user_id: ID of the user whose count should be refreshed.

    Returns:
        The updated integer unread count.
    """
    # Count unread notifications directly from the database
    count = Notification.objects.filter(recipient_id=user_id, is_read=False).count()
    cache.set(_unread_count_cache_key(user_id), count, UNREAD_COUNT_CACHE_TTL_SECONDS)
    return count


def increment_unread_count(user_id, amount=1):
    """Safely increment or decrement the cached unread count.

    Args:
        user_id: ID of the user.
        amount: Integer amount to add (can be negative). Defaults to 1.

    Returns:
        The new integer unread count.
    """
    key = _unread_count_cache_key(user_id)
    cached_count = cache.get(key)

    # If cache is empty, refresh from DB instead of guessing
    if cached_count is None:
        current_count = Notification.objects.filter(
            recipient_id=user_id,
            is_read=False,
        ).count()
    else:
        # Update the cached value, ensuring it never drops below zero
        current_count = max(cached_count + amount, 0)

    cache.set(key, current_count, UNREAD_COUNT_CACHE_TTL_SECONDS)
    return current_count


def set_unread_count(user_id, count):
    """Explicitly set the cached unread count for a user.

    Args:
        user_id: ID of the user.
        count: Integer count to set.
    """
    # Ensure count is not negative before caching
    cache.set(
        _unread_count_cache_key(user_id),
        max(count, 0),
        UNREAD_COUNT_CACHE_TTL_SECONDS,
    )
