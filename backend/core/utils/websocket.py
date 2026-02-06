from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_user(user_id, data):
    """
    Send a real-time notification update to a specific user via WebSockets.
    """
    channel_layer = get_channel_layer()
    group_name = f"user_{user_id}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "notification_update",
            "data": data
        }
    )
