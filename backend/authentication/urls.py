from django.urls import path
from knox.views import LoginView, LogoutView

from .views import RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("session/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logoutall/", LogoutView.as_view(all=True), name="logoutall")
]