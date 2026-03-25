"""Authentication views."""

from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


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
