"""Queryset helpers for admin-panel user filtering."""

from django.db.models import Q


def apply_search_filter(queryset, search):
    """Apply username and email search filtering when requested."""
    if not search:
        return queryset
    return queryset.filter(
        Q(username__icontains=search) | Q(email__icontains=search)
    )


def apply_role_filter(queryset, role):
    """Apply a role filter to the admin-panel user queryset."""
    role_filters = {
        "staff": {"is_staff": True},
        "admin": {"is_superuser": True},
        "users": {"is_staff": False, "is_superuser": False},
    }
    filter_kwargs = role_filters.get(role)
    if filter_kwargs is None:
        return queryset
    return queryset.filter(**filter_kwargs)
