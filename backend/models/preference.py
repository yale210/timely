from django.db import models
from django.contrib.postgres.fields import ArrayField
from .user import User
import holidays

#User: Username, User ID, FirstName, LastName, DOB, Email, DO NOT NEED INSIDE USER: Events, Tasks, Preferences
#Events: USERID, Event ID, time, date, importance, Recurring/not recurring (e.g. one-off) and how often its recurring and for how long
#Tasks: USERID, Task ID, estimated time, complete (bool), deadline, SHOULD BE ITS OWN MODEL:(task category), notes (string), priority, subtasks (maps one-to-many to other task IDs),
#Preferences: Sleep start and end time, commute time, Date/time when not to schedule tasks (rest times), max study hours per day
# Task category: have unique categories so the db does not store the same thing thousands of times  (ie school)

class Preference(models.Model):
    user = models.ForeignKey(User,on_delete = models.CASCADE, null=True, blank=True, related_name='user')
    
    sleep_start = models.TimeField()
    sleep_end = models.TimeField()
    
    max_daily_study_time = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(24)
        ]
    )

    
    # 1=Monday,2=Tuesday...,7=Sunday
    # Separate special dates model for any other one off dates (like "My birthday! : 25th april", etc)
    days_off = models.JSONField(default=list)

    # User may want certain holidays or dates off (birthdays, weddings, etc). We will store this in a separate model for ease.
    # A typical user will commute twice or more a day. I have added a commute model just to make it easier to handle this (particulary when doing the timetable)

    # Get the a list of holidays for an inputted year.
    # Assumes united kingdom holidays only.
    # Year as int. 
    def getHolidaysForYear(self,input_year):
        return holidays.UnitedKingdom(years=[input_year])

    def getSleep(self):
        return(f"{sleep_start} - {sleep_end}")
