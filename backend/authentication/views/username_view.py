"""API view for looking up a user's username by ID."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


class UsernameView(APIView):
    """Return the username for a user ID."""

    def get(self, request, user_id: int):
        """Return the requested user's public identifier fields.

        Args:
            request: The incoming DRF request.
            user_id: The primary key of the user being looked up.

        Returns:
            Response: A `200 OK` payload with the user's ID and username,
            or `404 Not Found` if the user does not exist.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "id": user.id,
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )
