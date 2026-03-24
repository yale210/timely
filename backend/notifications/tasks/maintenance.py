"""Maintenance tasks for cleaning up old notifications and logs."""

from celery import shared_task
from django.utils import timezone

from core.models import ReminderDispatchLog
from notifications.models import Notification
from notifications.utils.websocket import send_websocket_notification


@shared_task(ignore_result=True)
def send_websocket_notification_task(user_id, data):
    """Celery task to send websocket notifications asynchronously.

    Args:
        user_id: ID of the user to notify.
        data: Dictionary containing the notification payload.
    """
    # Delegate to the utility function for actual dispatch
    send_websocket_notification(user_id, data)


@shared_task
def cleanup_old_notifications():
    """Clean up notifications older than 30 days and logs older than 90 days."""
    # Remove notifications that have passed the 30-day retention period
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    Notification.objects.filter(timestamp__lt=thirty_days_ago).delete()

    # Remove dispatch logs that have passed the 90-day retention period
    dispatch_cutoff = timezone.now() - timezone.timedelta(days=90)
    ReminderDispatchLog.objects.filter(dispatched_at__lt=dispatch_cutoff).delete()
