"""Signal handlers for the notifications app."""

from .notification_signal import push_notification_on_create

__all__ = [
    "push_notification_on_create",
]
