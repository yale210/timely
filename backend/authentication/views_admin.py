from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions

from .serializer import AdminUserListSerializer


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        user_model = get_user_model()
        queryset = user_model.objects.all().order_by("username")
        search = self.request.query_params.get("search")
        role = self.request.query_params.get("role")

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )

        if role == "staff":
            queryset = queryset.filter(is_staff=True)
        elif role == "admin":
            queryset = queryset.filter(is_superuser=True)
        elif role == "users":
            queryset = queryset.filter(is_staff=False, is_superuser=False)

        return queryset
