from django.contrib.auth import get_user_model
from django.db import models


class Profile(models.Model):

    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    date_of_birth = models.DateField(null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    slogan = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
