"""Asynchronous tasks and helper utilities for the notifications app.

This package also re-exports commonly used notification models and helpers
for convenience and backwards compatibility.
"""

from pywebpush import webpush

from notifications.models import Notification
from notifications.tasks.broadcast import (
    _build_broadcast_queryset,
    broadcast_notification,
    process_broadcast_job,
)
from notifications.tasks.maintenance import (
    cleanup_old_notifications,
    send_websocket_notification_task,
)
from notifications.tasks.push import (
    _send_push_notification_sync,
    send_push_notification,
)
from notifications.tasks.reminders import (
    _process_due_reminders,
    _record_dispatch,
    _reminder_signature,
    check_reminders,
)
from notifications.utils.websocket import notify_user

__all__ = [
    "Notification",
    "_build_broadcast_queryset",
    "_process_due_reminders",
    "_record_dispatch",
    "_reminder_signature",
    "_send_push_notification_sync",
    "broadcast_notification",
    "check_reminders",
    "cleanup_old_notifications",
    "notify_user",
    "process_broadcast_job",
    "send_push_notification",
    "send_websocket_notification_task",
    "webpush",
]
