"""Views for managing student grades."""

from rest_framework import permissions, viewsets

from core.models import Grade
from core.serializers import GradeSerializer


class GradeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student grades.

    Provides standard CRUD operations for grades belonging to the authenticated user.
    """

    queryset = Grade.objects.none()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Retrieve grades for the current user ordered by date achieved.

        Returns:
            QuerySet: A filtered queryset of Grade objects.

        """
        return Grade.objects.filter(user=self.request.user).order_by("-date_achieved")

    def perform_create(self, serializer):
        """Save the new grade linked to the current user.

        Args:
            serializer (BaseSerializer): The serializer instance containing validated data.

        """
        serializer.save(user=self.request.user)
