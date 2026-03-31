"""Models for managing broadcast notification jobs."""

from django.conf import settings
from django.db import models


class BroadcastJob(models.Model):
    """Represents a bulk notification task targeting multiple users."""

    class Target(models.TextChoices):
        """Possible targets for a broadcast job."""

        ALL = "all", "All users"
        STAFF = "staff", "Staff"
        ADMIN = "admin", "Admins"
        USERS = "users", "Specific users"
        RETRY_FAILED = "retry_failed", "Retry failed recipients"

    class Status(models.TextChoices):
        """Execution status of a broadcast job."""

        QUEUED = "QUEUED", "Queued"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        COMPLETED = "COMPLETED", "Completed"
        PARTIAL = "PARTIAL", "Partial"
        FAILED = "FAILED", "Failed"

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_broadcast_jobs",
    )
    title = models.CharField(max_length=60)
    message = models.CharField(max_length=240)
    target = models.CharField(max_length=32, choices=Target.choices)
    audience_filters = models.JSONField(default=dict, blank=True)
    audience_snapshot = models.JSONField(default=dict, blank=True)
    recipient_count = models.PositiveIntegerField(default=0)
    delivered_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.QUEUED,
    )
    task_id = models.CharField(max_length=255, blank=True, default="")
    provider_errors = models.JSONField(default=list, blank=True)
    queued_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    retry_of = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="retry_jobs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta options for BroadcastJob."""

        ordering = ["-queued_at"]

    def __str__(self):
        """Generates a human-readable identifier for the broadcast job.

        Returns:
            str: A formatted string containing the job's primary key and current status
                (e.g., 'BroadcastJob#42 IN_PROGRESS').
        """
        return f"BroadcastJob#{self.pk} {self.status}"


class BroadcastRecipient(models.Model):
    """Tracks the delivery status of a broadcast to a specific user."""

    class DeliveryStatus(models.TextChoices):
        """Status of broadcast delivery to an individual recipient."""

        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        SENT_NO_PUSH = "SENT_NO_PUSH", "Sent (no push devices)"
        FAILED = "FAILED", "Failed"

    broadcast_job = models.ForeignKey(
        BroadcastJob,
        on_delete=models.CASCADE,
        related_name="recipients",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="broadcast_recipients",
    )
    notification = models.ForeignKey(
        "notifications.Notification",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="broadcast_recipients",
    )
    status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
    )
    error_code = models.CharField(max_length=64, blank=True, default="")
    error_message = models.TextField(blank=True, default="")
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta options for BroadcastRecipient."""

        unique_together = ("broadcast_job", "recipient")
        ordering = ["id"]

    def __str__(self):
        """Generates a human-readable identifier for the broadcast recipient.

        Returns:
            str: A formatted string containing the recipient's primary key and current
                delivery status (e.g., 'BroadcastRecipient#123 SENT').
        """
        return f"BroadcastRecipient#{self.pk} {self.status}"


class BroadcastAuditLog(models.Model):
    """Audit log for actions taken on broadcast jobs."""

    class Action(models.TextChoices):
        """Audited actions for broadcast jobs."""

        SEND = "SEND", "Send"
        RETRY = "RETRY", "Retry"

    broadcast_job = models.ForeignKey(
        BroadcastJob,
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="broadcast_audit_logs",
    )
    action = models.CharField(max_length=16, choices=Action.choices)
    audience_snapshot = models.JSONField(default=dict, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta options for BroadcastAuditLog."""

        ordering = ["-created_at"]

    def __str__(self):
        """Generates a human-readable identifier for the broadcast audit log.

        Returns:
            str: A formatted string containing the audit log's primary key and the action
                performed (e.g., 'BroadcastAuditLog#99 RETRY').
        """
        return f"BroadcastAuditLog#{self.pk} {self.action}"
