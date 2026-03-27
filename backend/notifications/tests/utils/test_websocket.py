"""Tests for WebSocket notification utilities."""

from unittest.mock import MagicMock, patch

from django.test import TestCase

from notifications.utils.websocket import notify_user, send_websocket_notification


class WebSocketUtilsTests(TestCase):
    """Test cases for WebSocket utility helpers."""

    @patch("notifications.utils.websocket.get_channel_layer")
    @patch("notifications.utils.websocket.async_to_sync")
    def test_send_websocket_notification_success(
        self, mock_async_to_sync, mock_get_channel_layer
    ):
        """Test send_websocket_notification succeeds with a channel layer."""
        mock_channel_layer = MagicMock()
        mock_get_channel_layer.return_value = mock_channel_layer

        result = send_websocket_notification(1, {"msg": "hello"})
        self.assertTrue(result)
        mock_async_to_sync.assert_called_once()

    @patch("notifications.utils.websocket.logger")
    @patch("notifications.utils.websocket.get_channel_layer")
    def test_send_websocket_notification_no_layer(
        self, mock_get_channel_layer, mock_logger
    ):
        """Test send_websocket_notification returns false without a channel layer."""
        mock_get_channel_layer.return_value = None
        result = send_websocket_notification(1, {"msg": "hello"})
        self.assertFalse(result)
        mock_logger.warning.assert_called_once()

    @patch("notifications.utils.websocket.logger")
    @patch("notifications.utils.websocket.get_channel_layer")
    @patch("notifications.utils.websocket.async_to_sync")
    def test_send_websocket_notification_exception(
        self, mock_async_to_sync, mock_get_channel_layer, mock_logger
    ):
        """Test send_websocket_notification handles dispatch failures gracefully."""
        mock_channel_layer = MagicMock()
        mock_get_channel_layer.return_value = mock_channel_layer
        mock_async_to_sync.return_value.side_effect = Exception("error")

        result = send_websocket_notification(1, {"msg": "hello"})
        self.assertFalse(result)
        mock_logger.exception.assert_called_once()

    @patch("notifications.tasks.send_websocket_notification_task.delay")
    def test_notify_user_success(self, mock_delay):
        """Test notify_user enqueues the websocket task successfully."""
        notify_user(1, {"msg": "hello"})
        mock_delay.assert_called_once_with(1, {"msg": "hello"})

    @patch("notifications.utils.websocket.logger")
    @patch("notifications.tasks.send_websocket_notification_task.delay")
    def test_notify_user_failure(self, mock_delay, mock_logger):
        """Test notify_user logs task enqueue failures without raising."""
        mock_delay.side_effect = Exception("error")
        notify_user(1, {"msg": "hello"})
        mock_delay.assert_called_once()
        mock_logger.exception.assert_called_once()
