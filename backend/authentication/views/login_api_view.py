"""Authentication views."""

from django.contrib.auth import login
from django.utils import timezone
from knox.views import (
    LoginView,
)
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..serializers import LoginSerializer, UserSerializer


class LoginAPIView(LoginView):
    """Authenticate a user and return a Knox token plus user details."""

    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request, format=None):
        """Log in a user and return token-based auth data.

        Args:
            request: The incoming DRF request containing login credentials.
            format: Optional response format passed through by DRF.

        Returns:
            Response: A `200 OK` response containing the Knox token payload
            and serialized user information.
        """
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        user.last_login = timezone.now()
        responses = super().post(request, format=None)
        responses.data["user"] = UserSerializer(user).data

        return Response(responses.data, status=status.HTTP_200_OK)
