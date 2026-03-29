"""Views for account deletion."""

from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer


class DeleteAccountView(APIView):
    """View for deleting authenticated user's account."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            200: inline_serializer(
                name="DeleteAccountResponse",
                fields={"message": serializers.CharField()},
            ),
        },
    )
    def delete(self, request):
        """Delete the account for the requesting user.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A response message.

        """
        user = request.user

        user.delete()

        response = {"message": "Account deleted successfully."}

        return Response(response)
