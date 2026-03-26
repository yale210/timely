"""Logic for finalizing broadcast notification delivery and status updates.

This module provides utility functions to transition broadcast jobs from an
'IN_PROGRESS' state to a terminal state (COMPLETED, FAILED, or PARTIAL) based
on the results of individual recipient delivery attempts.
"""

from django.db import transaction
from django.utils import timezone

from ..models import BroadcastJob, BroadcastRecipient


def determine_broadcast_status(delivered_count, failed_count):
    """Determine the status of a broadcast job based on delivery results.

    Args:
        delivered_count (int): Number of successfully delivered notifications.
        failed_count (int): Number of notifications that failed to deliver.

    Returns:
        str: The status code representing completion, failure, or partial success.
    """
    if failed_count == 0:
        return BroadcastJob.Status.COMPLETED
    if delivered_count == 0:
        return BroadcastJob.Status.FAILED
    return BroadcastJob.Status.PARTIAL


def complete_broadcast_without_recipients(broadcast):
    """Mark a broadcast as failed when no recipients are identified.

    Args:
        broadcast (BroadcastJob): The broadcast job instance to update.
    """
    broadcast.status = BroadcastJob.Status.FAILED
    broadcast.completed_at = timezone.now()
    broadcast.failed_count = 0
    broadcast.delivered_count = 0
    broadcast.provider_errors = [
        {"code": "ZERO_AUDIENCE", "message": "Broadcast has no recipients."}
    ]
    broadcast.save(
        update_fields=[
            "status",
            "completed_at",
            "failed_count",
            "delivered_count",
            "provider_errors",
            "updated_at",
        ]
    )


def build_broadcast_websocket_payload(notification, sender_username, unread_count):
    """Construct a payload for WebSocket notification broadcasts.

    Args:
        notification (Notification, optional): The notification instance.
        sender_username (str): Username of the notification sender.
        unread_count (int): Updated unread count for the recipient.

    Returns:
        dict: Payload containing notification details or just unread count.
    """
    if notification and notification.id and notification.timestamp:
        return {
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
        }

    return {"type": "unread_count", "count": unread_count}


def finalise_broadcast_delivery(broadcast, recipients, delivered, failed, errors):
    """Update database with final results of a broadcast delivery attempt.

    Args:
        broadcast (BroadcastJob): The broadcast job being finalised.
        recipients (list): List of BroadcastRecipient objects to update.
        delivered (int): Total number of successful deliveries.
        failed (int): Total number of delivery failures.
        errors (list): List of error details encountered during delivery.
    """
    with transaction.atomic():
        BroadcastRecipient.objects.bulk_update(
            recipients,
            [
                "notification",
                "status",
                "error_code",
                "error_message",
                "last_attempt_at",
                "updated_at",
            ],
        )

        broadcast.delivered_count = delivered
        broadcast.failed_count = failed
        broadcast.status = determine_broadcast_status(delivered, failed)
        broadcast.provider_errors = errors
        broadcast.completed_at = timezone.now()
        broadcast.save(
            update_fields=[
                "status",
                "delivered_count",
                "failed_count",
                "provider_errors",
                "completed_at",
                "updated_at",
            ]
        )
