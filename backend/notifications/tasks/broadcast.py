"""Celery tasks for processing broadcast notification jobs."""

import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from notifications.models import BroadcastJob, BroadcastRecipient, Notification
from notifications.utils.unread_count import refresh_unread_count
from notifications.utils.websocket import notify_user
from notifications.tasks.push import _send_push_notification_sync

logger = logging.getLogger(__name__)
User = get_user_model()


def _build_broadcast_queryset(target, user_ids=None):
    """Build the queryset of users to receive a broadcast.

    Args:
        target: The target audience identifier (e.g., 'all', 'staff').
        user_ids: Optional list of specific user IDs.

    Returns:
        A queryset of active User objects matching the target criteria.
    """
    user_ids = user_ids or []
    base_queryset = User.objects.filter(is_active=True)
    
    # Filter users based on the specified target
    if target == BroadcastJob.Target.ALL:
        return base_queryset
    if target == BroadcastJob.Target.STAFF:
        return base_queryset.filter(is_staff=True)
    if target == BroadcastJob.Target.ADMIN:
        return base_queryset.filter(is_superuser=True)
    if target == BroadcastJob.Target.USERS and user_ids:
        return base_queryset.filter(id__in=user_ids)
    return User.objects.none()


@shared_task
def process_broadcast_job(broadcast_job_id):
    """Process a broadcast job by creating notifications and sending push notifications.

    Args:
        broadcast_job_id: The primary key of the BroadcastJob to process.

    Returns:
        A status message indicating the result of the processing.
    """
    broadcast = BroadcastJob.objects.select_related("sender").filter(id=broadcast_job_id).first()
    if not broadcast:
        return "Broadcast not found"

    # Ensure the job hasn't already been processed or failed
    if not _should_process_broadcast(broadcast):
        return f"Broadcast already processed with status={broadcast.status}"

    _initialise_broadcast_job(broadcast)

    # Retrieve all recipients registered for this job
    recipients = list(BroadcastRecipient.objects.filter(broadcast_job=broadcast).select_related("recipient"))
    if not recipients:
        _handle_empty_recipients(broadcast)
        return "Broadcast has no recipients"

    sender_username = broadcast.sender.username if broadcast.sender else None
    notifications_by_recipient_id = _create_broadcast_notifications(broadcast, recipients)

    # Dispatch to all identified recipients
    delivered, failed, errors = _dispatch_to_recipients(broadcast, recipients, notifications_by_recipient_id, sender_username)

    _finalise_broadcast_job(broadcast, recipients, delivered, failed, errors)

    return f"Processed broadcast #{broadcast.id} (sent={delivered}, failed={failed})"


def _should_process_broadcast(broadcast):
    """Check if a broadcast job is in a processable status.

    Args:
        broadcast: The BroadcastJob instance.

    Returns:
        True if the status allows processing, False otherwise.
    """
    return broadcast.status in {BroadcastJob.Status.QUEUED, BroadcastJob.Status.IN_PROGRESS}


def _initialise_broadcast_job(broadcast):
    """Initialize the broadcast job status and started time.

    Args:
        broadcast: The BroadcastJob instance to initialize.
    """
    broadcast.status = BroadcastJob.Status.IN_PROGRESS
    broadcast.started_at = timezone.now()
    broadcast.save(update_fields=["status", "started_at", "updated_at"])


def _dispatch_to_recipients(broadcast, recipients, notifications_by_id, sender_username):
    """Dispatch notifications to all recipients and track results.

    Args:
        broadcast: The BroadcastJob instance.
        recipients: List of BroadcastRecipient objects.
        notifications_by_id: Dictionary mapping user IDs to Notification objects.
        sender_username: Username of the broadcast sender.

    Returns:
        A tuple containing (delivered_count, failed_count, provider_errors).
    """
    delivered_count = 0
    failed_count = 0
    provider_errors = []
    now = timezone.now()

    for recipient in recipients:
        notification = notifications_by_id.get(recipient.recipient_id)
        recipient.notification = notification
        recipient.last_attempt_at = now

        # Send real-time updates via WebSocket
        _notify_recipient_websocket(recipient, notification, sender_username)
        
        # Dispatch push notification
        success, error_code, error_msg = _send_single_push(recipient, broadcast)

        if success:
            delivered_count += 1
        else:
            failed_count += 1
            provider_errors.append({
                "recipient_id": recipient.recipient_id,
                "code": error_code,
                "message": error_msg
            })

    return delivered_count, failed_count, provider_errors


def _send_single_push(recipient, broadcast):
    """Send a single push notification and update recipient status.

    Args:
        recipient: The BroadcastRecipient instance.
        broadcast: The BroadcastJob instance containing content.

    Returns:
        A tuple containing (success_bool, error_code, error_message).
    """
    push_result = _send_push_notification_sync(recipient.recipient_id, broadcast.title, broadcast.message)
    
    if push_result["success"]:
        recipient.status = BroadcastRecipient.DeliveryStatus.SENT
        recipient.error_code = ""
        recipient.error_message = ""
        return True, "", ""

    recipient.status = BroadcastRecipient.DeliveryStatus.FAILED
    recipient.error_code = push_result["error_code"]
    recipient.error_message = push_result["error_message"]
    return False, push_result["error_code"], push_result["error_message"]


def _handle_empty_recipients(broadcast):
    """Handle the case where a broadcast has no recipients.

    Args:
        broadcast: The BroadcastJob instance to mark as failed.
    """
    broadcast.status = BroadcastJob.Status.FAILED
    broadcast.completed_at = timezone.now()
    broadcast.failed_count = 0
    broadcast.delivered_count = 0
    broadcast.provider_errors = [{"code": "ZERO_AUDIENCE", "message": "Broadcast has no recipients."}]
    broadcast.save(update_fields=[
        "status", "completed_at", "failed_count", "delivered_count", "provider_errors", "updated_at"
    ])


def _create_broadcast_notifications(broadcast, recipients):
    """Create Notification objects for all recipients in bulk.

    Args:
        broadcast: The BroadcastJob instance.
        recipients: List of BroadcastRecipient objects.

    Returns:
        A dictionary mapping recipient user IDs to the created Notification objects.
    """
    notifications = [
        Notification(
            recipient_id=recipient.recipient_id,
            sender_id=broadcast.sender_id,
            title=broadcast.title,
            message=broadcast.message,
            notification_type=Notification.NotificationType.SYSTEM,
        )
        for recipient in recipients
    ]
    # Perform bulk creation for efficiency
    with transaction.atomic():
        created_notifications = Notification.objects.bulk_create(notifications, batch_size=1000)

    return {n.recipient_id: n for n in created_notifications}


def _notify_recipient_websocket(recipient, notification, sender_username):
    """Send websocket notification to a recipient.

    Args:
        recipient: The BroadcastRecipient instance.
        notification: The Notification instance.
        sender_username: Username of the sender.
    """
    unread_count = refresh_unread_count(recipient.recipient_id)
    if notification and notification.id and notification.timestamp:
        notify_user(
            recipient.recipient_id,
            {
                "type": "new_notification",
                "notification": {
                    "id": notification.id,
                    "recipient": notification.recipient_id,
                    "sender": notification.sender_id,
                    "sender_username": sender_username,
                    "title": notification.title,
                    "message": notification.message,
                    "is_read": notification.is_read,
                    "timestamp": notification.timestamp.isoformat(),
                    "notification_type": notification.notification_type,
                },
                "unread_count": unread_count,
            },
        )
    else:
        # Fallback if notification object isn't fully formed
        notify_user(recipient.recipient_id, {"type": "unread_count", "count": unread_count})


def _finalise_broadcast_job(broadcast, recipients, delivered, failed, errors):
    """Update the broadcast job and recipients after processing.

    Args:
        broadcast: The BroadcastJob instance.
        recipients: List of updated BroadcastRecipient objects.
        delivered: Count of successful deliveries.
        failed: Count of failed deliveries.
        errors: List of provider error details.
    """
    # Batch update recipient statuses
    BroadcastRecipient.objects.bulk_update(
        recipients,
        ["notification", "status", "error_code", "error_message", "last_attempt_at", "updated_at"]
    )

    broadcast.delivered_count = delivered
    broadcast.failed_count = failed
    broadcast.status = _calculate_broadcast_status(delivered, failed)
    broadcast.provider_errors = errors
    broadcast.completed_at = timezone.now()
    broadcast.save(update_fields=[
        "status", "delivered_count", "failed_count", "provider_errors", "completed_at", "updated_at"
    ])


def _calculate_broadcast_status(delivered_count, failed_count):
    """Determine the overall status of the broadcast job.

    Args:
        delivered_count: Total successful deliveries.
        failed_count: Total failed deliveries.

    Returns:
        The appropriate Status choice for the BroadcastJob.
    """
    if failed_count == 0:
        return BroadcastJob.Status.COMPLETED
    if delivered_count == 0:
        return BroadcastJob.Status.FAILED
    return BroadcastJob.Status.PARTIAL


@shared_task
def broadcast_notification(title, message, target="all", user_ids=None):
    """Legacy-compatible broadcast helper retained for existing tests and scripts.

    Args:
        title: The notification title.
        message: The notification message body.
        target: Audience identifier.
        user_ids: Optional list of user IDs for targeted broadcast.

    Returns:
        A string summary of the broadcast operation.
    """
    if target not in {
        BroadcastJob.Target.ALL, BroadcastJob.Target.STAFF,
        BroadcastJob.Target.ADMIN, BroadcastJob.Target.USERS
    }:
        return "Invalid target"

    # Identify the target user IDs
    recipient_ids = list(_build_broadcast_queryset(target, user_ids).values_list("id", flat=True))
    if not recipient_ids:
        return "Broadcasted to 0 users"

    # Create the job and trigger processing
    broadcast = _create_broadcast_job(title, message, target, user_ids, recipient_ids)
    process_broadcast_job(broadcast.id)
    return f"Broadcasted to {len(recipient_ids)} users"


def _create_broadcast_job(title, message, target, user_ids, recipient_ids):
    """Create a BroadcastJob and its recipients.

    Args:
        title: Notification title.
        message: Notification body.
        target: Target identifier.
        user_ids: List of targeted user IDs.
        recipient_ids: List of recipient user IDs identified for this job.

    Returns:
        The created BroadcastJob instance.
    """
    with transaction.atomic():
        broadcast = BroadcastJob.objects.create(
            sender=None,
            title=title,
            message=message,
            target=target,
            audience_filters={"target": target, "user_ids": user_ids or []},
            audience_snapshot={
                "recipient_ids": recipient_ids,
                "recipient_count": len(recipient_ids)
            },
            recipient_count=len(recipient_ids),
            status=BroadcastJob.Status.QUEUED,
        )
        # Create recipient tracking records in bulk
        BroadcastRecipient.objects.bulk_create(
            [BroadcastRecipient(broadcast_job=broadcast, recipient_id=rid) for rid in recipient_ids],
            batch_size=1000
        )
    return broadcast
