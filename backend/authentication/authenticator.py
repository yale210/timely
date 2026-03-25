"""Authentication app components."""

from django.contrib.auth.backends import BaseBackend

from .models import User


class Authenticator(BaseBackend):
    """Authenticate users against the custom user model."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        """Authenticate a user by username and password.

        Args:
            request: The current HTTP request.
            username: The username provided by the user.
            password: The raw password provided by the user.
            **kwargs: Additional authentication arguments.

        Returns:
            User | None: The authenticated user if credentials are valid,
            otherwise None.
        """
        user = User.objects.filter(username=username).first()
        if not user:
            return None
        if user.check_password(password):
            return user
        return None
