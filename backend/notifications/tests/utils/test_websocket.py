from django.test import TestCase
from unittest.mock import patch, MagicMock
from notifications.utils.websocket import send_websocket_notification, notify_user


class WebSocketUtilsTests(TestCase):
    @patch("notifications.utils.websocket.get_channel_layer")
    @patch("notifications.utils.websocket.async_to_sync")
    def test_send_websocket_notification_success(
        self, mock_async_to_sync, mock_get_channel_layer
    ):
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
        mock_channel_layer = MagicMock()
        mock_get_channel_layer.return_value = mock_channel_layer
        mock_async_to_sync.return_value.side_effect = Exception("error")

        result = send_websocket_notification(1, {"msg": "hello"})
        self.assertFalse(result)
        mock_logger.exception.assert_called_once()

    @patch("notifications.tasks.send_websocket_notification_task.delay")
    def test_notify_user_success(self, mock_delay):
        notify_user(1, {"msg": "hello"})
        mock_delay.assert_called_once_with(1, {"msg": "hello"})

    @patch("notifications.utils.websocket.logger")
    @patch("notifications.tasks.send_websocket_notification_task.delay")
    def test_notify_user_failure(self, mock_delay, mock_logger):
        mock_delay.side_effect = Exception("error")
        # Should not raise exception
        notify_user(1, {"msg": "hello"})
        mock_delay.assert_called_once()
        mock_logger.exception.assert_called_once()
