"""Tasks for dispatching Web Push notifications."""

import json
import logging

from celery import shared_task
from django.conf import settings
from pywebpush import WebPushException, webpush

from notifications.models import PushSubscription

logger = logging.getLogger(__name__)

_FRIENDLY_PUSH_ERRORS: dict[int, str] = {
    400: "Push subscription is invalid or expired.",
    401: "Push server rejected our credentials.",
    403: "Push server denied access.",
    404: "Push subscription no longer exists.",
    410: "Push subscription has expired.",
    413: "Notification payload was too large.",
    429: "Too many push requests — try again later.",
}


def _humanize_push_error(ex: WebPushException) -> str:
    """Convert a WebPushException into a short, human-readable message.

    Args:
        ex: The WebPushException raised by pywebpush.

    Returns:
        A concise description suitable for display in the admin UI.
    """
    if ex.response is not None:
        status = ex.response.status_code
        friendly = _FRIENDLY_PUSH_ERRORS.get(status)
        if friendly:
            return friendly
        return f"Push delivery failed (HTTP {status})."
    return "Push delivery failed due to a network error."


def _dispatch_to_subscription(sub: PushSubscription, payload: str) -> tuple[bool, str]:
    """Dispatch a push notification to a single subscription.

    Args:
        sub: The PushSubscription instance to target.
        payload: The JSON-encoded string payload.

    Returns:
        A tuple of (success_boolean, error_message_string).
    """
    try:
        # Execute the push request using the webpush library.
        # TTL must be > 0 for Edge/WNS (rejects TTL=0 with 400).
        # X-WNS-Cache-Policy is required by WNS; other push services ignore it.
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"},
            ttl=86400,
            headers={"x-wns-cache-policy": "cache"},
        )
        return True, ""
    except WebPushException as ex:
        if ex.response and ex.response.status_code in [400, 404, 410]:
            logger.warning(
                "Removing invalid push subscription %s (user %s): %s %s",
                sub.id,
                sub.user_id,
                ex.response.status_code,
                ex,
            )
            sub.delete()
        return False, _humanize_push_error(ex)


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
        return {
            "success": True,
            "error_code": "NO_PUSH_SUBSCRIPTIONS",
            "error_message": "",
        }

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
