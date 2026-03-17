from django.contrib.auth import login
from django.utils import timezone
from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from knox.views import (
    LoginView,
    LogoutAllView as KnoxLogoutAllView,
    LogoutView as KnoxLogoutView,
)
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    """Handle user registration requests."""
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    @extend_schema(request=RegisterSerializer, responses={201: RegisterSerializer})
    def post(self, request):
        """Create a new user account.

        Args:
            request: The incoming DRF request containing registration data.

        Returns:
            Response: A `201 Created` response with the serialized user data.
        """
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
        if serializer.is_valid(raise_exception=True):
            user = serializer.validated_data["user"]
            login(request, user)
            user.last_login = timezone.now()
            responses = super().post(request, format=None)
            responses.data["user"] = UserSerializer(user).data
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(responses.data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={204: OpenApiResponse(description="Successfully logged out.")},
    )
)
class LogoutAPIView(KnoxLogoutView):
    """Log out the current authenticated session."""
    pass


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            204: OpenApiResponse(
                description="Successfully logged out from all sessions."
            )
        },
    )
)
class LogoutAllAPIView(KnoxLogoutAllView):
    """Log out the user from all active authenticated sessions."""
    pass


class TestPermissionView(APIView):
    """Provide a simple authenticated endpoint for permission testing."""
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={
            200: inline_serializer(
                name="TestPermissionResponseSerializer",
                fields={"message": serializers.CharField()},
            )
        }
    )
    def get(self, request):
        """Return a message confirming the user is authenticated.

        Args:
            request: The incoming authenticated DRF request.

        Returns:
            Response: A `200 OK` response with a simple authentication message.
        """
        return Response({"message": "You are authenticated!: " + str(request.user)})
