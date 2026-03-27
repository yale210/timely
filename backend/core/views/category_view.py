"""Views for managing user categories."""

from rest_framework import permissions, viewsets

from core.models import Category
from core.serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user-defined categories.

    Provides standard CRUD operations for categories belonging to the authenticated user.
    """

    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Retrieve categories for the current user ordered by text.

        Returns:
            QuerySet: A filtered queryset of Category objects.

        """
        return Category.objects.filter(user=self.request.user).order_by("text")

    def perform_create(self, serializer):
        """Save the new category linked to the current user.

        Args:
            serializer (BaseSerializer): The serializer instance containing validated data.

        """
        serializer.save(user=self.request.user)
