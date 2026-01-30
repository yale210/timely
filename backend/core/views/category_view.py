from rest_framework import viewsets, permissions

from core.models import Category
from core.serializers import CategorySerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("text")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
