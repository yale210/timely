"""Views for managing user preferences."""

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.models import Preference
from core.serializers.preference_serializer import PreferenceSerializer


class PreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user preferences.

    Provides standard CRUD operations and a 'me' action for the current user's preferences.
    """

    queryset = Preference.objects.none()
    serializer_class = PreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Retrieve preferences for the current user.

        Returns:
            QuerySet: A filtered queryset of Preference objects.

        """
        return Preference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Save the new preference linked to the current user, ensuring uniqueness.

        Args:
            serializer (BaseSerializer): The serializer instance containing validated data.

        Raises:
            ValidationError: If the user already has a set preference.

        """
        if Preference.objects.filter(user=self.request.user).exists():
            raise ValidationError("This user already has a set preference.")
        serializer.save()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Retrieve the authenticated user's preferences.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A DRF response containing preference data.

        """
        pref, _ = Preference.objects.get_or_create(user=request.user)
        return Response(self.get_serializer(pref).data)

    @me.mapping.patch
    def me_path(self, request):
        """Partial update the authenticated user's preferences.

        Args:
            request (Request): The DRF request object.

        Returns:
            Response: A DRF response containing updated preference data.

        """
        pref, _ = Preference.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



