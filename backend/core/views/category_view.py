from rest_framework import viewsets, permissions

from core.models import Category
from core.serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by("text")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
