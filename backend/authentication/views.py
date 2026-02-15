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

from .serializer import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    @extend_schema(request=RegisterSerializer, responses={201: RegisterSerializer})
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LoginAPIView(LoginView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request, format=None):
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
    pass


class TestPermissionView(APIView):
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
        return Response({"message": "You are authenticated!: " + str(request.user)})
