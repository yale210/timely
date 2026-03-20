import json
import logging

from celery import shared_task
from django.conf import settings
from pywebpush import WebPushException, webpush

from notifications.models import PushSubscription

logger = logging.getLogger(__name__)


def _dispatch_to_subscription(sub: PushSubscription, payload: str) -> tuple[bool, str]:
    """
    Dispatches a push notification to a single subscription.
    Returns (success, error_message).
    """
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"},
        )
        return True, ""
    except WebPushException as ex:
        if ex.response and ex.response.status_code in [404, 410]:
            sub.delete()
        return False, str(ex)


def _send_push_notification_sync(user_id, title, message):
    """
    Synchronously sends a push notification to all subscriptions for a user.
    """
    subscriptions = PushSubscription.objects.filter(user_id=user_id)
    if not subscriptions.exists():
        return {"success": True, "error_code": "", "error_message": ""}

    payload = json.dumps({"title": title, "message": message})
    had_success = False
    error_message = ""

    for sub in subscriptions:
        success, error = _dispatch_to_subscription(sub, payload)
        had_success = had_success or success
        if not success and not error_message:
            error_message = error

    if had_success:
        return {"success": True, "error_code": "", "error_message": ""}

    return {
        "success": False,
        "error_code": "PUSH_PROVIDER_FAILURE",
        "error_message": error_message or "Push provider delivery failed.",
    }


@shared_task
def send_push_notification(user_id, title, message):
    """
    Celery task to send push notification.
    """
    return _send_push_notification_sync(user_id, title, message)
