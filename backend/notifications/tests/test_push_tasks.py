import json
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from pywebpush import WebPushException

from notifications.models import PushSubscription
from notifications.tasks.push import (
    _dispatch_to_subscription,
    _humanize_push_error,
    _send_push_notification_sync,
)

User = get_user_model()


class PushTaskTests(TestCase):
    """Test cases for push task."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com"
        )
        self.sub = PushSubscription.objects.create(
            user=self.user,
            endpoint="https://example.com/endpoint",
            p256dh="p256dh",
            auth="auth",
        )
        self.payload = json.dumps({"title": "Test", "message": "Body"})

    @patch("notifications.tasks.push.webpush")
    def test_dispatch_to_subscription_success(self, mock_webpush):
        # Arrange
        """Test dispatch to subscription success."""
        mock_webpush.return_value = None

        # Act
        success, error = _dispatch_to_subscription(self.sub, self.payload)

        # Assert
        self.assertTrue(success)
        self.assertEqual(error, "")
        mock_webpush.assert_called_once()

    @patch("notifications.tasks.push.webpush")
    def test_dispatch_to_subscription_failure_delete(self, mock_webpush):
        # Arrange
        """Test dispatch to subscription failure delete."""
        mock_response = MagicMock()
        mock_response.status_code = 410
        mock_webpush.side_effect = WebPushException("Gone", response=mock_response)

        # Act
        success, error = _dispatch_to_subscription(self.sub, self.payload)

        # Assert
        self.assertFalse(success)
        self.assertEqual(error, "Push subscription has expired.")
        self.assertFalse(PushSubscription.objects.filter(id=self.sub.id).exists())

    @patch("notifications.tasks.push.webpush")
    def test_dispatch_deletes_subscription_on_400(self, mock_webpush):
        """Test that a 400 response auto-deletes the stale subscription."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_webpush.side_effect = WebPushException(
            "Bad Request", response=mock_response
        )

        success, error = _dispatch_to_subscription(self.sub, self.payload)

        self.assertFalse(success)
        self.assertFalse(PushSubscription.objects.filter(id=self.sub.id).exists())

    @patch("notifications.tasks.push.webpush")
    def test_dispatch_does_not_delete_on_429(self, mock_webpush):
        """Test that a 429 response does NOT delete the subscription."""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_webpush.side_effect = WebPushException(
            "Too Many", response=mock_response
        )

        success, error = _dispatch_to_subscription(self.sub, self.payload)

        self.assertFalse(success)
        self.assertTrue(PushSubscription.objects.filter(id=self.sub.id).exists())

    @patch("notifications.tasks.push.webpush")
    def test_dispatch_passes_ttl_and_wns_header(self, mock_webpush):
        """Test that webpush is called with ttl=86400 and x-wns-cache-policy header."""
        mock_webpush.return_value = None

        _dispatch_to_subscription(self.sub, self.payload)

        call_kwargs = mock_webpush.call_args[1]
        self.assertEqual(call_kwargs["ttl"], 86400)
        self.assertEqual(call_kwargs["headers"]["x-wns-cache-policy"], "cache")

    @patch("notifications.tasks.push.webpush")
    def test_dispatch_returns_friendly_error_for_400(self, mock_webpush):
        """Test that dispatch returns a human-readable message, not raw exception."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_webpush.side_effect = WebPushException(
            "Bad Request", response=mock_response
        )

        success, error = _dispatch_to_subscription(self.sub, self.payload)

        self.assertFalse(success)
        self.assertEqual(error, "Push subscription is invalid or expired.")


class HumanizePushErrorTests(TestCase):
    """Test cases for _humanize_push_error helper."""

    def test_known_status_codes_return_friendly_messages(self):
        """Test that all mapped status codes return their friendly messages."""
        expected = {
            400: "Push subscription is invalid or expired.",
            401: "Push server rejected our credentials.",
            403: "Push server denied access.",
            404: "Push subscription no longer exists.",
            410: "Push subscription has expired.",
            413: "Notification payload was too large.",
            429: "Too many push requests — try again later.",
        }
        for status_code, message in expected.items():
            mock_response = MagicMock()
            mock_response.status_code = status_code
            ex = WebPushException(f"Error {status_code}", response=mock_response)

            result = _humanize_push_error(ex)

            self.assertEqual(result, message, f"Failed for status {status_code}")

    def test_unknown_status_code_returns_generic_http_message(self):
        """Test that an unmapped status code returns a fallback HTTP message."""
        mock_response = MagicMock()
        mock_response.status_code = 503
        ex = WebPushException("Service Unavailable", response=mock_response)

        result = _humanize_push_error(ex)

        self.assertEqual(result, "Push delivery failed (HTTP 503).")

    def test_no_response_returns_network_error(self):
        """Test that an exception without a response returns a network error message."""
        ex = WebPushException("Connection refused")
        ex.response = None

        result = _humanize_push_error(ex)

        self.assertEqual(result, "Push delivery failed due to a network error.")


class SendPushNotificationSyncTests(TestCase):
    """Test cases for _send_push_notification_sync."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="pushuser", email="push@example.com"
        )

    def test_no_subscriptions_returns_no_push_subscriptions(self):
        """Test that a user with no push subscriptions returns NO_PUSH_SUBSCRIPTIONS."""
        result = _send_push_notification_sync(self.user.id, "Title", "Message")

        self.assertTrue(result["success"])
        self.assertEqual(result["error_code"], "NO_PUSH_SUBSCRIPTIONS")
        self.assertEqual(result["error_message"], "")

    @patch("notifications.tasks.push.webpush")
    def test_all_subscriptions_fail_returns_provider_failure(self, mock_webpush):
        """Test that failure on all subscriptions returns PUSH_PROVIDER_FAILURE."""
        PushSubscription.objects.create(
            user=self.user,
            endpoint="https://example.com/ep1",
            p256dh="key1",
            auth="auth1",
        )
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_webpush.side_effect = WebPushException(
            "Too Many", response=mock_response
        )

        result = _send_push_notification_sync(self.user.id, "Title", "Message")

        self.assertFalse(result["success"])
        self.assertEqual(result["error_code"], "PUSH_PROVIDER_FAILURE")
        self.assertEqual(
            result["error_message"],
            "Too many push requests \u2014 try again later.",
        )

    @patch("notifications.tasks.push.webpush")
    def test_at_least_one_success_returns_success(self, mock_webpush):
        """Test that success on at least one subscription is considered success."""
        PushSubscription.objects.create(
            user=self.user,
            endpoint="https://example.com/ep1",
            p256dh="key1",
            auth="auth1",
        )
        PushSubscription.objects.create(
            user=self.user,
            endpoint="https://example.com/ep2",
            p256dh="key2",
            auth="auth2",
        )
        mock_response = MagicMock()
        mock_response.status_code = 410
        mock_webpush.side_effect = [
            WebPushException("Gone", response=mock_response),
            None,
        ]

        result = _send_push_notification_sync(self.user.id, "Title", "Message")

        self.assertTrue(result["success"])
        self.assertEqual(result["error_code"], "")
        self.assertEqual(result["error_message"], "")
