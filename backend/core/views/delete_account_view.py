"""Views for account deletion."""

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView


class DeleteAccountView(APIView):
    """View for deleting authenticated user's account."""

    permission_classes = [permissions.IsAuthenticated]

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
