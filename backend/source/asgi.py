"""ASGI application entrypoint for HTTP and websocket traffic."""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "source.settings")
django_asgi_app = get_asgi_application()

# Import websocket routes after Django setup so routing modules run against
# an initialized app registry.
import notifications.routing

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(notifications.routing.websocket_urlpatterns)
        ),
    }
)
