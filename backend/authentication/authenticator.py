from django.contrib.auth.backends import BaseBackend

from .models import User


class Authenticator(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        user = User.objects.filter(email=email).first()
        if not user:
            return None
        if user.check_password(password):
            return user
        return None