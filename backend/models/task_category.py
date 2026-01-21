from django.db import models
from .task import Task

#User: Username, User ID, FirstName, LastName, DOB, Email, DO NOT NEED INSIDE USER: Events, Tasks, Preferences
#Events: USERID, Event ID, time, date, importance, Recurring/not recurring (e.g. one-off) and how often its recurring and for how long
#Tasks: USERID, Task ID, estimated time, complete (bool), deadline, SHOULD BE ITS OWN MODEL:(task category), notes (string), priority, subtasks (maps one-to-many to other task IDs),
#Preferences: Sleep start and end time, commute time, Date/time when not to schedule tasks (rest times), max study hours per day
# Task category: have unique categories so the db does not store the same thing thousands of times  (ie school)

class TaskCategory(models.Model):
    category = models.CharField(max_length=20,unique=True,blank=False,null=False)
    
    # Return category.
    def __str__(self):
        return self.category