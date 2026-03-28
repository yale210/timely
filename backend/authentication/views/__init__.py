"""Authentication views."""

from .login_api_view import LoginAPIView
from .logout_all_api_view import LogoutAllAPIView
from .logout_api_view import LogoutAPIView
from .permission_test_view import TestPermissionView
from .register_view import RegisterView
from .username_view import UsernameView

__all__ = [
    "LoginAPIView",
    "LogoutAPIView",
    "LogoutAllAPIView",
    "RegisterView",
    "TestPermissionView",
    "UsernameView",
]
