from django.urls import path
from knox.views import LoginView, LogoutView, LogoutAllView

from .views import RegisterView, LoginAPIView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("session/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logoutall/", LogoutAllView.as_view(), name="logoutall")
]