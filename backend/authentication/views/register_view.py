from drf_spectacular.utils import (
    extend_schema,
)
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import RegisterSerializer


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
