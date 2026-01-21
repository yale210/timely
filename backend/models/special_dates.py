from django.db import models
from .user import User
import holidays

class SpecialDates(models.Model):
    user = models.ForeignKey(User,on_delete = models.CASCADE, related_name='special_dates')
    date = models.DateField()
    text = models.CharField(max_length=250)

    def __str__(self):
        if text:
            return text
        else:
            return ""