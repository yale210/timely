from django.db import transaction
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView


class DeleteAccountRequestSerializer(serializers.Serializer):
    """Validate the password required for account deletion."""

    password = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):
        """Require the authenticated user's current password."""
        request = self.context["request"]
        if not request.user.check_password(attrs["password"]):
            raise serializers.ValidationError({"password": ["Incorrect password."]})
        return attrs


class DeleteAccountView(APIView):
    """View for deleting authenticated user's account."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=DeleteAccountRequestSerializer,
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
        serializer = DeleteAccountRequestSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user.delete()

        response = {"message": "Account deleted successfully."}

        return Response(response)
