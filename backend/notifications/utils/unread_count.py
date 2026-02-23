from django.core.cache import cache

from notifications.models import Notification

UNREAD_COUNT_CACHE_TTL_SECONDS = 60 * 60


def _unread_count_cache_key(user_id):
    return f"notifications:unread_count:{user_id}"


def refresh_unread_count(user_id):
    count = Notification.objects.filter(recipient_id=user_id, is_read=False).count()
    cache.set(_unread_count_cache_key(user_id), count, UNREAD_COUNT_CACHE_TTL_SECONDS)
    return count


def increment_unread_count(user_id, amount=1):
    key = _unread_count_cache_key(user_id)
    cached_count = cache.get(key)
    if cached_count is None:
        current_count = Notification.objects.filter(
            recipient_id=user_id,
            is_read=False,
        ).count()
    else:
        current_count = max(cached_count + amount, 0)

    cache.set(key, current_count, UNREAD_COUNT_CACHE_TTL_SECONDS)
    return current_count


def set_unread_count(user_id, count):
    cache.set(
        _unread_count_cache_key(user_id),
        max(count, 0),
        UNREAD_COUNT_CACHE_TTL_SECONDS,
    )
