from django.db import models

from source import settings


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    slogan = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
