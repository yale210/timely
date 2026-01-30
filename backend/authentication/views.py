from django.contrib.auth import login
from knox.views import LoginView
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializer import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

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
            responses = super().post(request, format=None)
            responses.data["user"] = UserSerializer(user).data
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(responses.data, status=status.HTTP_200_OK)


class TestPermissionView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response({"message": "You are authenticated!: " + str(request.user)})