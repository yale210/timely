from django.db import models
from .user import User
from datetime import datetime,date
from django.core.validators import MinValueValidator, MaxValueValidator

#Preferences: Sleep start and end time, commute time, Date/time when not to schedule tasks (rest times), max study hours per day

class Commute(models.Model):
    user = models.ForeignKey(User,on_delete = models.CASCADE, related_name='commutes')
    commute_start = models.TimeField()
    commute_end = models.TimeField()

    def __str__(self):
        return(f"{self.commute_start} - {self.commute_end}")