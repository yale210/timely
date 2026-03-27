"""ASGI application entrypoint for HTTP and websocket traffic."""

from importlib import import_module
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "source.settings")
django_asgi_app = get_asgi_application()

notifications_routing = import_module("notifications.routing")


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(notifications_routing.websocket_urlpatterns)
        ),
    }
)
