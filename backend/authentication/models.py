"""Database models for user accounts and authentication."""

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models


class UserManager(BaseUserManager):
    """Manage creation of regular users and superusers."""

    def create_user(self, username, password=None, **extra_fields):
        """Create and save a regular user.

        Args:
            username: The username for the new user.
            password: The raw password for the new user.
            **extra_fields: Additional fields for the user model, including email.

        Returns:
            User: The created user instance.

        Raises:
            ValueError: If the username or email is missing.
        """
        if not username:
            raise ValueError("Users must have a username")
        if not extra_fields.get("email"):
            raise ValueError("Users must have an email address")
        email = self.normalize_email(extra_fields.pop("email"))
        extra_fields.setdefault("is_active", True)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """Create and save a superuser.

        Args:
            username: The username for the superuser.
            password: The raw password for the superuser.
            **extra_fields: Additional fields for the user model.

        Returns:
            User: The created superuser instance.

        Raises:
            ValueError: If is_staff or is_superuser is not set to True.
        """
        extra_fields.update({"is_staff": True})
        extra_fields.update({"is_superuser": True})

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must be assigned to is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must be assigned to is_superuser=True.")

        user = self.create_user(username, password, **extra_fields)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model that uses username as the login field."""

    alphanumeric = RegexValidator(
        r"^[0-9a-zA-Z]*$", "Only alphanumeric characters are allowed."
    )

    username = models.CharField(max_length=255, unique=True, validators=[alphanumeric])
    email = models.EmailField(max_length=255, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(
        default=True,
    )
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    objects = UserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ("email",)
