import json
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from pywebpush import WebPushException

from notifications.models import PushSubscription
from notifications.tasks.push import _dispatch_to_subscription

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
        self.assertIn("Gone", error)
        self.assertFalse(PushSubscription.objects.filter(id=self.sub.id).exists())
