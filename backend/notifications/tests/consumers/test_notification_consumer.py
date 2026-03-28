import asyncio

from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TransactionTestCase
from django.test.testcases import SerializeMixin

from notifications.routing import websocket_urlpatterns

User = get_user_model()


class NotificationConsumerTest(SerializeMixin, TransactionTestCase):
    lockfile = __file__

    async def _test_connect_authenticated(self):
        user = await User.objects.acreate(username="testuser", email="test@example.com")

        communicator = WebsocketCommunicator(
            URLRouter(websocket_urlpatterns), "/ws/notifications/"
        )
        communicator.scope["user"] = user

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.disconnect()

    async def _test_connect_anonymous(self):
        communicator = WebsocketCommunicator(
            URLRouter(websocket_urlpatterns), "/ws/notifications/"
        )
        communicator.scope["user"] = AnonymousUser()

        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def _test_notification_update(self):
        user = await User.objects.acreate(
            username="testuser2", email="test2@example.com"
        )
        communicator = WebsocketCommunicator(
            URLRouter(websocket_urlpatterns), "/ws/notifications/"
        )
        communicator.scope["user"] = user
        await communicator.connect()

        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"user_{user.id}",
            {"type": "notification_update", "data": {"message": "hello"}},
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response, {"message": "hello"})

        await communicator.disconnect()

    async def _test_disconnect_anonymous(self):
        communicator = WebsocketCommunicator(
            URLRouter(websocket_urlpatterns), "/ws/notifications/"
        )
        communicator.scope["user"] = AnonymousUser()

        # Connect will fail and close
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

        await communicator.disconnect()

    def test_all_consumer_logic(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._test_connect_authenticated())
            loop.run_until_complete(self._test_connect_anonymous())
            loop.run_until_complete(self._test_notification_update())
            loop.run_until_complete(self._test_disconnect_anonymous())
        finally:
            loop.close()
