"""Queryset helpers for admin-panel user filtering."""

from django.db.models import Q


def apply_search_filter(queryset, search):
    """Apply username and email search filtering when requested.

    Args:
        queryset (QuerySet): The base User queryset.
        search (str): The search query to match against username and email.

    Returns:
        QuerySet: The filtered queryset.
    """
    if not search:
        return queryset
    # Perform case-insensitive search across username and email fields
    return queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))


def apply_role_filter(queryset, role):
    """Apply a role filter to the admin-panel user queryset.

    Args:
        queryset (QuerySet): The base User queryset.
        role (str): The role identifier to filter by ('staff', 'admin', 'users').

    Returns:
        QuerySet: The filtered queryset.
    """
    role_filters = {
        "staff": {"is_staff": True},
        "admin": {"is_superuser": True},
        "users": {"is_staff": False, "is_superuser": False},
    }
    filter_kwargs = role_filters.get(role)
    if filter_kwargs is None:
        return queryset
    # Filter users based on staff/superuser status mapping
    return queryset.filter(**filter_kwargs)
