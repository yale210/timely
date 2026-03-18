"""User management actions for the admin panel."""

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response


class AdminUsersActionMixin:
    """Provide user listing and filtering actions for admins."""

    def _get_user_queryset(self, request):
        """Build the user queryset for admin list requests.

        Args:
            request: The incoming DRF request.

        Returns:
            QuerySet: Filtered user queryset ordered by username.
        """
        user_model = get_user_model()
        queryset = user_model.objects.all().order_by("username")
        search = request.query_params.get("search")
        role = request.query_params.get("role")

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

    @action(detail=False, methods=["get"])
    def users(self, request):
        """Return a paginated list of users for the admin panel.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Paginated or full serialized user list.
        """
        queryset = self._get_user_queryset(request)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
