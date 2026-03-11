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
        queryset.update(is_read=True)


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "endpoint", "created_at")
    search_fields = ("user__username", "endpoint")


@admin.register(BroadcastJob)
class BroadcastJobAdmin(admin.ModelAdmin):
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
    list_display = ("id", "broadcast_job", "action", "actor", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("actor__username",)
