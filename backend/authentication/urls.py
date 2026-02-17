from django.urls import path

from .views import (
    LoginAPIView,
    LogoutAllAPIView,
    LogoutAPIView,
    RegisterView,
    TestPermissionView,
)
from .views_admin import AdminUserListView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("session/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("logoutall/", LogoutAllAPIView.as_view(), name="logoutall"),
    path("test/", TestPermissionView.as_view(), name="test"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
]
