"""Tasks for dispatching Web Push notifications."""

import json
import logging

from celery import shared_task
from django.conf import settings
from pywebpush import WebPushException, webpush

from notifications.models import PushSubscription

logger = logging.getLogger(__name__)


def _dispatch_to_subscription(sub: PushSubscription, payload: str) -> tuple[bool, str]:
    """Dispatch a push notification to a single subscription.

    Args:
        sub: The PushSubscription instance to target.
        payload: The JSON-encoded string payload.

    Returns:
        A tuple of (success_boolean, error_message_string).
    """
    try:
        # Execute the push request using the webpush library
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
        # Automatically delete subscriptions that are no longer valid
        if ex.response and ex.response.status_code in [404, 410]:
            sub.delete()
        return False, str(ex)


def _send_push_notification_sync(user_id, title, message):
    """Synchronously send a push notification to all subscriptions for a user.

    Args:
        user_id: ID of the recipient user.
        title: Notification title.
        message: Notification body.

    Returns:
        A dictionary containing success status and error details.
    """
    subscriptions = list(PushSubscription.objects.filter(user_id=user_id))
    if not subscriptions:
        return {"success": True, "error_code": "", "error_message": ""}

    payload = json.dumps({"title": title, "message": message})
    had_success = False
    error_message = ""

    # Attempt delivery to every registered device for the user
    for sub in subscriptions:
        success, error = _dispatch_to_subscription(sub, payload)
        had_success = had_success or success
        if not success and not error_message:
            error_message = error

    # Consider the operation a success if at least one device received it
    if had_success:
        return {"success": True, "error_code": "", "error_message": ""}

    return {
        "success": False,
        "error_code": "PUSH_PROVIDER_FAILURE",
        "error_message": error_message or "Push provider delivery failed.",
    }


@shared_task
def send_push_notification(user_id, title, message):
    """Celery task to send push notification to all user's devices.

    Args:
        user_id: ID of the recipient user.
        title: Notification title string.
        message: Notification message body string.

    Returns:
        The result of the synchronous push operation.
    """
    return _send_push_notification_sync(user_id, title, message)
