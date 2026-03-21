from django.db import models

from django.conf import settings


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_profile"
    )
    name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    slogan = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    xp = models.PositiveBigIntegerField(default=0)
    level = models.PositiveBigIntegerField(default=1)
