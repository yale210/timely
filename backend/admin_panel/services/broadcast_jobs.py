"""Service helpers for admin-panel broadcast job workflows."""

from django.db import transaction

from notifications.models import BroadcastAuditLog, BroadcastJob, BroadcastRecipient
from notifications.tasks import process_broadcast_job


def build_audience_snapshot(recipient_ids):
    """Build a stable audience snapshot for broadcast persistence.

    Args:
        recipient_ids (list): List of user IDs targeted by the broadcast.

    Returns:
        dict: A snapshot containing the recipient IDs and their total count.
    """
    return {
        "recipient_ids": recipient_ids,
        "recipient_count": len(recipient_ids),
    }


def create_broadcast_recipients(broadcast_job, recipient_ids):
    """Create recipient rows for the supplied broadcast job in bulk.

    Args:
        broadcast_job (BroadcastJob): The parent broadcast job instance.
        recipient_ids (list): List of user IDs to associate with this job.
    """
    # Create BroadcastRecipient records in batches of 1000 for efficiency
    BroadcastRecipient.objects.bulk_create(
        [
            BroadcastRecipient(
                broadcast_job=broadcast_job,
                recipient_id=recipient_id,
            )
            for recipient_id in recipient_ids
        ],
        batch_size=1000,
    )


def create_broadcast_audit_log(
    *,
    broadcast_job,
    actor,
    action,
    audience_snapshot,
    title,
    message,
    target,
):
    """Persist a broadcast audit log entry.

    Args:
        broadcast_job (BroadcastJob): The associated broadcast job.
        actor (User): The user performing the action (sender).
        action (str): The action performed (SEND, RETRY, etc.).
        audience_snapshot (dict): The audience state at the time of the action.
        title (str): The title of the broadcast.
        message (str): The message content of the broadcast.
        target (str): The target audience identifier.
    """
    BroadcastAuditLog.objects.create(
        broadcast_job=broadcast_job,
        actor=actor,
        action=action,
        audience_snapshot=audience_snapshot,
        payload={"title": title, "message": message, "target": target},
    )


def create_broadcast_job(*, sender, title, message, target, user_ids, recipient_ids):
    """Create a queued broadcast job and its related records in a single transaction.

    Args:
        sender (User): The user creating the broadcast.
        title (str): The broadcast title.
        message (str): The broadcast message content.
        target (str): The target audience type.
        user_ids (list): Explicit user IDs targeted (if any).
        recipient_ids (list): Resolved list of recipient user IDs.

    Returns:
        BroadcastJob: The newly created and saved broadcast job instance.
    """
    audience_snapshot = build_audience_snapshot(recipient_ids)
    with transaction.atomic():
        # Atomically create the job, recipients, and audit log
        broadcast_job = BroadcastJob.objects.create(
            sender=sender,
            title=title,
            message=message,
            target=target,
            audience_filters={"target": target, "user_ids": user_ids},
            audience_snapshot=audience_snapshot,
            recipient_count=len(recipient_ids),
            status=BroadcastJob.Status.QUEUED,
        )
        create_broadcast_recipients(broadcast_job, recipient_ids)
        create_broadcast_audit_log(
            broadcast_job=broadcast_job,
            actor=sender,
            action=BroadcastAuditLog.Action.SEND,
            audience_snapshot=audience_snapshot,
            title=title,
            message=message,
            target=target,
        )
    return broadcast_job


def get_failed_recipient_ids(broadcast_job):
    """Return recipient IDs that failed for the supplied broadcast.

    Args:
        broadcast_job (BroadcastJob): The broadcast job to check for failures.

    Returns:
        list: List of recipient user IDs that have a FAILED status.
    """
    return list(
        BroadcastRecipient.objects.filter(
            broadcast_job=broadcast_job,
            status=BroadcastRecipient.DeliveryStatus.FAILED,
        ).values_list("recipient_id", flat=True)
    )


def create_retry_broadcast_job(*, sender, broadcast, failed_recipient_ids):
    """Create a retry broadcast job for failed recipients only.

    Args:
        sender (User): The user initiating the retry.
        broadcast (BroadcastJob): The original broadcast job being retried.
        failed_recipient_ids (list): List of user IDs that failed in the original job.

    Returns:
        BroadcastJob: The newly created retry broadcast job instance.
    """
    audience_snapshot = build_audience_snapshot(failed_recipient_ids)
    with transaction.atomic():
        # Create a new broadcast job specifically for the failed recipients
        retry_job = BroadcastJob.objects.create(
            sender=sender,
            title=broadcast.title,
            message=broadcast.message,
            target=BroadcastJob.Target.RETRY_FAILED,
            audience_filters={
                "retry_of": broadcast.id,
                "recipient_ids": failed_recipient_ids,
            },
            audience_snapshot=audience_snapshot,
            recipient_count=len(failed_recipient_ids),
            status=BroadcastJob.Status.QUEUED,
            retry_of=broadcast,
        )
        create_broadcast_recipients(retry_job, failed_recipient_ids)
        create_broadcast_audit_log(
            broadcast_job=retry_job,
            actor=sender,
            action=BroadcastAuditLog.Action.RETRY,
            audience_snapshot=audience_snapshot,
            title=retry_job.title,
            message=retry_job.message,
            target=retry_job.target,
        )
    return retry_job


def queue_broadcast_job(broadcast_job, task_runner=process_broadcast_job):
    """Queue the async worker job and persist its task identifier.

    Args:
        broadcast_job (BroadcastJob): The broadcast job to be queued.
        task_runner (celery.Task, optional): The task instance to use.
            Defaults to process_broadcast_job.

    Returns:
        celery.result.AsyncResult: The queued task result.
    """
    task = task_runner.delay(broadcast_job.id)
    broadcast_job.task_id = task.id
    # Persist the task ID immediately so it can be tracked via the API
    broadcast_job.save(update_fields=["task_id", "updated_at"])
    return task


def build_queued_job_payload(broadcast_job, task_id):
    """Build the accepted-response payload for queued broadcasts.

    Args:
        broadcast_job (BroadcastJob): The broadcast job instance.
        task_id (str): The Celery task identifier.

    Returns:
        dict: A dictionary suitable for JSON serialization in a response.
    """
    return {
        "status": broadcast_job.status,
        "broadcast_id": broadcast_job.id,
        "task_id": task_id,
        "queued_at": broadcast_job.queued_at.isoformat(),
        "recipient_count": broadcast_job.recipient_count,
    }
