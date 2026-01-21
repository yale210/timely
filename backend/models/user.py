from django.db import models

#User: Username, User ID, FirstName, LastName, DOB, Email, DO NOT NEED INSIDE USER: Events, Tasks, Preferences
#Events: Username, Event ID, time, date, importance, Recurring/not recurring (e.g. one-off) and how often its recurring and for how long
#Tasks: Username, Task ID, estimated time, complete (bool), deadline, task category, notes (string), priority, subtasks (maps one-to-many to other task IDs),
#Preferences: Sleep start and end time, commute time, Date/time when not to schedule tasks (rest times), max study hours per day

class User(models.Model):
    username=models.CharField(max_length=15)
    first_name=models.CharField(max_length=50,null=True,blank=True)
    last_name=models.CharField(max_length=50,null=True,blank=True)
    date_of_birth=models.DateField(null=True,blank=True)
    email=CharField(max_length=254,null=True,blank=True)

    # Return username.
    def __str__(self):
        return self.username