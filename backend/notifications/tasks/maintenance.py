from celery import shared_task
from django.utils import timezone

from core.models import ReminderDispatchLog
from notifications.models import Notification
from notifications.utils.websocket import send_websocket_notification


@shared_task(ignore_result=True)
def send_websocket_notification_task(user_id, data):
    """
    Celery task to send websocket notifications.
    """
    send_websocket_notification(user_id, data)


@shared_task
def cleanup_old_notifications():
    """
    Cleans up notifications older than 30 days and dispatch logs older than 90 days.
    """
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    Notification.objects.filter(timestamp__lt=thirty_days_ago).delete()
    
    dispatch_cutoff = timezone.now() - timezone.timedelta(days=90)
    ReminderDispatchLog.objects.filter(dispatched_at__lt=dispatch_cutoff).delete()
