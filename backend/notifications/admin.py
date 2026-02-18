from django.contrib import admin

from notifications.models import Notification, PushSubscription


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
