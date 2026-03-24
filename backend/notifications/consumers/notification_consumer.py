"""WebSocket consumer for real-time notifications."""

import json

from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer for handling user-specific notification updates over WebSockets."""

    async def connect(self):
        """Handle initial WebSocket connection.

        Authenticates the user and adds them to a user-specific group for targeted updates.
        """
        self.user = self.scope["user"]

        # Reject connection if user is not authenticated
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Use a unique group name per user to allow targeted messaging
        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection.

        Args:
            close_code: The integer code representing the reason for closure.
        """
        # Clean up by removing the channel from the user's group
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification_update(self, event):
        """Receive and forward notification updates to the client.

        Args:
            event: A dictionary containing the notification data.
        """
        # Send JSON-encoded data directly to the client
        await self.send(text_data=json.dumps(event["data"]))
