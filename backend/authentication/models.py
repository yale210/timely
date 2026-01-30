from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("Users must have a username")
        if not extra_fields.get("email"):
            raise ValueError("Users must have an email address")
        email = self.normalize_email(extra_fields.get("email"))
        user = self.model(username=username, email=email)
        user.set_password(password)
        extra_fields.setdefault("is_active", True)
        user.save()
        return user

    def create_superuser(self, username, password=None, **extra_fields):
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
    username = models.CharField(max_length=255, unique=True)

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
