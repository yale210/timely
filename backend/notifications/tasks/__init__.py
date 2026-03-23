"""Asynchronous tasks and helper utilities for the notifications app.

This package also re-exports commonly used notification models and helpers
for convenience and backwards compatibility."""

from notifications.models import Notification
from pywebpush import webpush
from notifications.utils.websocket import notify_user

from notifications.tasks.push import (
    send_push_notification,
    _send_push_notification_sync,
)
from notifications.tasks.broadcast import (
    broadcast_notification,
    process_broadcast_job,
    _build_broadcast_queryset,
)
from notifications.tasks.reminders import (
    check_reminders,
    _record_dispatch,
    _reminder_signature,
    _process_due_reminders,
)
from notifications.tasks.maintenance import (
    cleanup_old_notifications,
    send_websocket_notification_task,
)

__all__ = [
    "Notification",
    "webpush",
    "notify_user",
    "send_push_notification",
    "_send_push_notification_sync",
    "broadcast_notification",
    "process_broadcast_job",
    "_build_broadcast_queryset",
    "check_reminders",
    "_record_dispatch",
    "_reminder_signature",
    "_process_due_reminders",
    "cleanup_old_notifications",
    "send_websocket_notification_task",
]
