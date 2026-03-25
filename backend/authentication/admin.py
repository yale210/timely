"""Authentication app components."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Configure admin behavior for the custom user model."""

    readonly_fields = ("date_joined",)

    list_display = (
        "username",
        "email",
        "is_staff",
        "is_active",
        "date_joined",
        "last_login",
    )

    list_filter = (
        "is_staff",
        "is_active",
        "is_superuser",
        "date_joined",
    )

    search_fields = (
        "username",
        "email",
    )

    ordering = ("date_joined",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("email", "date_of_birth")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    filter_horizontal = (
        "groups",
        "user_permissions",
    )

    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "email",
                    "date_of_birth",
                ),
            },
        )
    ]
