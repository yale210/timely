from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

User = get_user_model()


class UsernameView(APIView):
    """
    Returns the username for a user ID.
    """

    def get(self, request, user_id: int):
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
