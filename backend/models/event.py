from django.db import models
from .user import User
from datetime import date
from django.core.validators import MinValueValidator, MaxValueValidator

#User: Username, User ID, FirstName, LastName, DOB, Email, DO NOT NEED INSIDE USER: Events, Tasks, Preferences
#Events: USERID, Event ID, time, date, importance, Recurring/not recurring (e.g. one-off) and how often its recurring and for how long
#Tasks: USERID, Task ID, estimated time, complete (bool), deadline, SHOULD BE ITS OWN MODEL:(task category), notes (string), priority, subtasks (maps one-to-many to other task IDs),
#Preferences: Sleep start and end time, commute time, Date/time when not to schedule tasks (rest times), max study hours per day
# Task category: have unique categories so the db does not store the same thing thousands of times  (ie school)

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
        if recurring_start!=null and recurring_start!=null:
            return (recurring_end-recurring_start).days
        else:
            return 0
    

     