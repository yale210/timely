from .login_api_view import LoginAPIView as LoginAPIView
from .logout_all_api_view import LogoutAllAPIView as LogoutAllAPIView
from .logout_api_view import LogoutAPIView as LogoutAPIView
from .permission_test_view import TestPermissionView as TestPermissionView
from .register_view import RegisterView as RegisterView

__all__ = [
    "LoginAPIView",
    "LogoutAllAPIView",
    "LogoutAPIView",
    "TestPermissionView",
    "RegisterView",
]
