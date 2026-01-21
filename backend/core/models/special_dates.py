from django.db import models
from django.conf import settings
import holidays

class SpecialDates(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE, 
        related_name='special_dates'
    )
    
    date = models.DateField()
    text = models.CharField(max_length=250)

    def __str__(self):
        if text:
            return text
        else:
            return ""