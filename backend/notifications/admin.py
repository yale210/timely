"""Admin configuration for the notifications app."""

from django.contrib import admin

from notifications.models import (
    BroadcastAuditLog,
    BroadcastJob,
    BroadcastRecipient,
    Notification,
    PushSubscription,
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for managing user notifications."""

    list_display = (
        "title",
        "recipient",
        "sender",
        "notification_type",
        "is_read",
        "timestamp",
    )
    list_filter = ("notification_type", "is_read", "timestamp")
    search_fields = ("title", "message", "recipient__username", "sender__username")
    actions = ["mark_as_read"]

    @admin.action(description="Mark selected notifications as read")
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read in bulk.

        Args:
            request: The current HTTP request.
            queryset: The queryset containing selected notifications.
        """
        # Batch update is_read status to True for all selected items
        queryset.update(is_read=True)


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for managing Web Push subscriptions."""

    list_display = ("user", "endpoint", "created_at")
    search_fields = ("user__username", "endpoint")


@admin.register(BroadcastJob)
class BroadcastJobAdmin(admin.ModelAdmin):
    """Admin interface for monitoring and managing broadcast jobs."""

    list_display = (
        "id",
        "title",
        "target",
        "status",
        "recipient_count",
        "delivered_count",
        "failed_count",
        "sender",
        "queued_at",
    )
    list_filter = ("target", "status", "queued_at")
    search_fields = ("title", "message", "sender__username", "task_id")


@admin.register(BroadcastRecipient)
class BroadcastRecipientAdmin(admin.ModelAdmin):
    """Admin interface for tracking individual broadcast recipients."""

    list_display = (
        "id",
        "broadcast_job",
        "recipient",
        "status",
        "error_code",
        "last_attempt_at",
    )
    list_filter = ("status",)
    search_fields = ("recipient__username", "error_message")


@admin.register(BroadcastAuditLog)
class BroadcastAuditLogAdmin(admin.ModelAdmin):
    """Admin interface for auditing broadcast-related actions."""

    list_display = ("id", "broadcast_job", "action", "actor", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("actor__username",)
