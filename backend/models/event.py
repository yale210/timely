from django.db import models
from .user import User
from datetime import date
from django.core.validators import MinValueValidator, MaxValueValidator

#Events: USERID, Event ID, time, date, importance, Recurring/not recurring (e.g. one-off) and how often its recurring and for how long

class Event(models.Model):
    user = models.ForeignKey(User,on_delete = models.CASCADE, null=True, blank=True, related_name='user')
    time = models.TimeField()
    date = models.DateField()
    # 1 least important, 10 insanely urgent
    importance = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(10)
        ]
    )
    recurring = models.BooleanField(default=False)
    recurring_start = models.DateField()
    recurring_end = models.DateField()

    def calculateTimeLeft(self):
        if self.recurring_start!=null and self.recurring_start!=null:
            return (self.recurring_end-self.recurring_start).days
        else:
            return 0
    

     